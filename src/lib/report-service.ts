import { addReportScore, createReport, getBossPersona, getReport, listReportsForAggregation, updateReportOptimizedContent } from "@/lib/db";
import { getRolePreset, scoreDimensionLabels } from "@/lib/role-presets";
import type { BossPersona, ReportRecord, ReportScore, ScoreDimension, ScoreDimensionId, WorkInput } from "@/lib/types";
import { callChatCompletion } from "@/lib/ai/providers";
import { buildOptimizePrompt, buildReportPrompt, buildScorePrompt } from "@/lib/ai/prompts";
import { clampScore, requireText } from "@/lib/utils";

const dimensionIds = Object.keys(scoreDimensionLabels) as ScoreDimensionId[];

export async function generateReport(input: {
  workInput: WorkInput;
  rolePresetId: string;
  roleProfile: ReportRecord["roleProfile"];
  bossPersonaId: string;
  provider: string;
  model: string;
}): Promise<{ report: ReportRecord; score: ReportScore }> {
  validateWorkInput(input.workInput);

  const bossPersona = getBossPersona(input.bossPersonaId);
  if (!bossPersona) throw new Error("未找到老板人设，请刷新后重试。");

  const historyReports =
    input.workInput.reportType === "daily"
      ? []
      : listReportsForAggregation({
          from: input.workInput.historyFrom || input.workInput.periodStart,
          to: input.workInput.historyTo || input.workInput.periodEnd,
          excludeType: input.workInput.reportType
        });

  const content = await callChatCompletion({
    providerId: input.provider,
    model: input.model,
    temperature: 0.32,
    messages: buildReportPrompt({
      workInput: input.workInput,
      roleProfile: input.roleProfile,
      bossPersona,
      rolePresetId: input.rolePresetId,
      historyReports
    })
  });

  const report = createReport({
    type: input.workInput.reportType,
    periodStart: input.workInput.periodStart,
    periodEnd: input.workInput.periodEnd,
    rolePresetId: input.rolePresetId,
    roleProfileId: input.roleProfile.id,
    bossPersonaId: bossPersona.id,
    provider: input.provider,
    model: input.model,
    workInput: input.workInput,
    roleProfile: input.roleProfile,
    bossPersona,
    content
  });

  const score = await scoreContent({
    reportId: report.id,
    target: "draft",
    content,
    workInput: input.workInput,
    roleProfile: input.roleProfile,
    bossPersona,
    rolePresetId: input.rolePresetId,
    provider: input.provider,
    model: input.model
  });

  return { report: { ...report, scores: [score] }, score };
}

export async function rescoreReport(input: {
  reportId: string;
  target?: "draft" | "optimized";
  provider?: string;
  model?: string;
}): Promise<{ report: ReportRecord; score: ReportScore }> {
  const report = getReport(input.reportId);
  if (!report) throw new Error("未找到报告。");
  const target = input.target ?? (report.optimizedContent ? "optimized" : "draft");
  const content = target === "optimized" ? report.optimizedContent || report.content : report.content;
  const score = await scoreContent({
    reportId: report.id,
    target,
    content,
    workInput: report.input,
    roleProfile: report.roleProfile,
    bossPersona: report.bossPersona,
    rolePresetId: report.rolePresetId,
    provider: input.provider || report.provider,
    model: input.model || report.model
  });
  return { report: getReport(report.id) || report, score };
}

export async function optimizeReport(input: {
  reportId: string;
  provider?: string;
  model?: string;
}): Promise<{ report: ReportRecord; score: ReportScore }> {
  const report = getReport(input.reportId);
  if (!report) throw new Error("未找到报告。");
  const score = report.scores.at(-1);
  if (!score) throw new Error("报告还没有评分，无法优化。");

  const optimizedContent = await callChatCompletion({
    providerId: input.provider || report.provider,
    model: input.model || report.model,
    temperature: 0.28,
    messages: buildOptimizePrompt({
      originalContent: report.optimizedContent || report.content,
      score,
      report
    })
  });

  const updated = updateReportOptimizedContent(report.id, optimizedContent);
  if (!updated) throw new Error("保存优化稿失败。");

  const optimizedScore = await scoreContent({
    reportId: updated.id,
    target: "optimized",
    content: optimizedContent,
    workInput: updated.input,
    roleProfile: updated.roleProfile,
    bossPersona: updated.bossPersona,
    rolePresetId: updated.rolePresetId,
    provider: input.provider || updated.provider,
    model: input.model || updated.model
  });

  return { report: getReport(updated.id) || updated, score: optimizedScore };
}

async function scoreContent(input: {
  reportId: string;
  target: "draft" | "optimized";
  content: string;
  workInput: WorkInput;
  roleProfile: ReportRecord["roleProfile"];
  bossPersona: BossPersona;
  rolePresetId: string;
  provider: string;
  model: string;
}): Promise<ReportScore> {
  try {
    const raw = await callChatCompletion({
      providerId: input.provider,
      model: input.model,
      temperature: 0.1,
      messages: buildScorePrompt(input)
    });
    return addReportScore({
      reportId: input.reportId,
      target: input.target,
      ...parseScore(raw, input.rolePresetId)
    });
  } catch (error) {
    const fallback = heuristicScore(input.content, input.workInput, input.rolePresetId);
    return addReportScore({
      reportId: input.reportId,
      target: input.target,
      ...fallback,
      summary: `${fallback.summary}（AI 评分失败，已使用本地规则兜底：${error instanceof Error ? error.message : "未知错误"}）`
    });
  }
}

function parseScore(raw: string, rolePresetId: string): Omit<ReportScore, "id" | "reportId" | "target" | "createdAt"> {
  const jsonText = extractJson(raw);
  const parsed = JSON.parse(jsonText) as Partial<ReportScore>;
  const dimensions = normalizeDimensions(parsed.dimensions, rolePresetId);
  return {
    total: clampScore(parsed.total || weightedTotal(dimensions, rolePresetId)),
    dimensions,
    suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.map(String).slice(0, 6) : ["补充更具体的数据、风险和下一步动作。"],
    summary: requireText(parsed.summary) || "整体可用，但仍需增强事实依据和领导适配度。"
  };
}

function extractJson(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("{")) return trimmed;
  const match = trimmed.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("模型评分未返回 JSON。");
  return match[0];
}

function normalizeDimensions(raw: unknown, rolePresetId: string): ScoreDimension[] {
  const incoming = Array.isArray(raw) ? raw : [];
  return dimensionIds.map((id) => {
    const found = incoming.find((item) => typeof item === "object" && item && (item as { id?: unknown }).id === id) as Partial<ScoreDimension> | undefined;
    return {
      id,
      name: scoreDimensionLabels[id],
      score: clampScore(found?.score ?? 70),
      reason: requireText(found?.reason) || "评分理由未提供。",
      suggestion: requireText(found?.suggestion) || defaultSuggestion(id)
    };
  }).sort((a, b) => getRolePreset(rolePresetId).scoreWeights[b.id] - getRolePreset(rolePresetId).scoreWeights[a.id]);
}

function weightedTotal(dimensions: ScoreDimension[], rolePresetId: string): number {
  const weights = getRolePreset(rolePresetId).scoreWeights;
  const totalWeight = dimensions.reduce((sum, dimension) => sum + weights[dimension.id], 0);
  const total = dimensions.reduce((sum, dimension) => sum + dimension.score * weights[dimension.id], 0);
  return clampScore(total / totalWeight);
}

function heuristicScore(content: string, workInput: WorkInput, rolePresetId: string): Omit<ReportScore, "id" | "reportId" | "target" | "createdAt"> {
  const hasDigit = /\d/.test(content);
  const hasRisk = /风险|问题|阻塞|待协调|暂无/.test(content);
  const hasNext = /下一步|明日|下周|计划|推进/.test(content);
  const hasSupport = /支持|决策|协调|确认|暂无需领导/.test(content);
  const hasSections = (content.match(/^#{1,3}\s/gm) || []).length >= 3 || (content.match(/\n[-*]\s/g) || []).length >= 4;
  const inputText = Object.values(workInput.fields).join("\n") + "\n" + workInput.extraText;
  const sparseInput = inputText.trim().length < 80;

  const scores: Record<ScoreDimensionId, number> = {
    boss_fit: 72 + (hasSupport ? 6 : 0),
    impact: 68 + (content.includes("成果") || content.includes("完成") ? 8 : 0),
    data: hasDigit ? 78 : 58,
    clarity: hasSections ? 82 : 66,
    risk: hasRisk ? 78 : 60,
    next_steps: hasNext ? 80 : 62,
    factfulness: sparseInput ? 68 : 82
  };

  const dimensions = dimensionIds
    .map((id) => ({
      id,
      name: scoreDimensionLabels[id],
      score: clampScore(scores[id]),
      reason: localReason(id, scores[id]),
      suggestion: defaultSuggestion(id)
    }))
    .sort((a, b) => getRolePreset(rolePresetId).scoreWeights[b.id] - getRolePreset(rolePresetId).scoreWeights[a.id]);

  return {
    total: weightedTotal(dimensions, rolePresetId),
    dimensions,
    suggestions: dimensions
      .filter((dimension) => dimension.score < 75)
      .slice(0, 4)
      .map((dimension) => dimension.suggestion),
    summary: "本地规则评分：报告结构基本可用，建议优先补充量化数据、风险影响和可检查的下一步动作。"
  };
}

function localReason(id: ScoreDimensionId, score: number): string {
  if (score >= 78) return `${scoreDimensionLabels[id]}表现较好。`;
  return `${scoreDimensionLabels[id]}仍有提升空间。`;
}

function defaultSuggestion(id: ScoreDimensionId): string {
  const suggestions: Record<ScoreDimensionId, string> = {
    boss_fit: "根据老板关注点调整信息顺序，把最关心的结果、风险或数据放在前面。",
    impact: "把动作改写成可判断的产出和业务影响。",
    data: "补充数量、比例、金额、进度、缺陷数、耗时等量化依据；没有数据时明确暂无量化数据。",
    clarity: "使用先结论后细节的结构，减少流水账。",
    risk: "说明风险状态、影响范围、预案和需要谁协调。",
    next_steps: "把下一步写成可检查的动作、时间点和责任对象。",
    factfulness: "删除没有输入依据的扩展表述，保留真实事实。"
  };
  return suggestions[id];
}

function validateWorkInput(workInput: WorkInput) {
  const text = Object.values(workInput.fields || {}).join("").trim() + (workInput.extraText || "").trim();
  if (!text) throw new Error("请先填写本周期工作内容。");
  if (!workInput.reportType) throw new Error("请选择报告类型。");
}
