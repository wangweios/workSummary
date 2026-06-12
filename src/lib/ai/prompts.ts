import { bossTagLabels, getRolePreset, scoreDimensionLabels } from "@/lib/role-presets";
import { getMarketPlaybook } from "@/lib/market-playbooks";
import type { BossPersona, ReportRecord, ReportScore, RoleProfile, WorkInput } from "@/lib/types";
import { reportTypeLabel } from "@/lib/utils";

export function buildReportPrompt(input: {
  workInput: WorkInput;
  roleProfile: Partial<RoleProfile>;
  bossPersona: BossPersona;
  rolePresetId: string;
  historyReports: ReportRecord[];
}): Array<{ role: "system" | "user"; content: string }> {
  const preset = getRolePreset(input.rolePresetId);
  const playbook = getMarketPlaybook(input.workInput.playbookId);
  const label = reportTypeLabel(input.workInput.reportType);
  return [
    {
      role: "system",
      content: [
        "你是一位专业的中文职场向上汇报教练。",
        "你的任务是把用户提供的真实工作材料整理成适合发给领导的日报、周报或月报。",
        "必须遵守：不编造事实、不虚构数字、不新增客户/收入/上线结果；没有数据时写“暂无量化数据”或“建议补充”。",
        "表达要稳妥正式、先结论后细节、突出结果、风险、下一步和需要领导支持的事项。",
        "输出只能是 Markdown 正文，不要解释你如何写作。"
      ].join("\n")
    },
    {
      role: "user",
      content: [
        `报告类型：${label}`,
        `周期：${input.workInput.periodStart || "未填写"} 至 ${input.workInput.periodEnd || "未填写"}`,
        "",
        "岗位预设：",
        `- 岗位：${preset.name}`,
        `- 写作重点：${preset.fieldHint}`,
        `- 本类型指引：${preset.reportGuidance[input.workInput.reportType].join("；")}`,
        "",
        "身份信息：",
        `- 名称：${input.roleProfile.name || "未填写"}`,
        `- 职位：${input.roleProfile.title || "未填写"}`,
        `- 职责：${input.roleProfile.responsibilities || "未填写"}`,
        `- 项目背景：${input.roleProfile.projectContext || "未填写"}`,
        `- 常用指标：${input.roleProfile.metrics || "未填写"}`,
        `- 偏好口吻：${input.roleProfile.tone || "稳妥正式"}`,
        "",
        "汇报打法（由同类状态报告/异步 standup 产品模式提炼）：",
        `- 打法：${playbook.name}`,
        `- 适用场景：${playbook.summary}`,
        `- 市场关键信号：${playbook.marketSignals.join("、")}`,
        `- 组织规则：${playbook.generationRules.join("；")}`,
        "",
        "老板人设：",
        `- 名称：${input.bossPersona.name}`,
        `- 描述：${input.bossPersona.description || "未填写"}`,
        `- 标签权重：${formatBossTags(input.bossPersona)}`,
        `- 禁忌：${input.bossPersona.avoidances || "未填写"}`,
        `- 语气：${input.bossPersona.tone}`,
        `- 信息密度：${input.bossPersona.density}`,
        "",
        "本次输入：",
        formatFields(input.workInput.fields),
        input.workInput.extraText ? `\n补充材料：\n${input.workInput.extraText}` : "\n补充材料：未填写",
        "",
        input.historyReports.length ? `历史材料：\n${formatHistory(input.historyReports)}` : "历史材料：无",
        "",
        "请生成一版“稳妥正式版”汇报，结构要求：",
        "- 开头必须有一句核心结论。",
        "- 必须包含关键成果/进展、数据或暂无量化数据、风险问题、下一步计划。",
        "- 如果存在需要领导支持或决策的事项，请单独列出；没有则写“暂无需领导额外协调”。",
        "- 不要写夸张宣传语，不要把动作包装成不存在的结果。"
      ].join("\n")
    }
  ];
}

export function buildScorePrompt(input: {
  content: string;
  workInput: WorkInput;
  roleProfile: Partial<RoleProfile>;
  bossPersona: BossPersona;
  rolePresetId: string;
}): Array<{ role: "system" | "user"; content: string }> {
  const preset = getRolePreset(input.rolePresetId);
  const playbook = getMarketPlaybook(input.workInput.playbookId);
  return [
    {
      role: "system",
      content: [
        "你是一位严谨的中文工作汇报评审。",
        "你要根据原始输入、岗位权重和老板人设，对汇报稿打分。",
        "必须输出严格 JSON，不要输出 Markdown，不要解释 JSON 之外的内容。"
      ].join("\n")
    },
    {
      role: "user",
      content: [
        "评分维度和权重：",
        Object.entries(preset.scoreWeights)
          .map(([key, weight]) => `- ${scoreDimensionLabels[key as keyof typeof scoreDimensionLabels]}：${weight}`)
          .join("\n"),
        "",
        "汇报打法：",
        `- ${playbook.name}：${playbook.summary}`,
        `- 加权关注：${playbook.scoreEmphasis.map((id) => scoreDimensionLabels[id]).join("、")}`,
        "",
        "老板人设：",
        `- ${input.bossPersona.name}`,
        `- 标签权重：${formatBossTags(input.bossPersona)}`,
        `- 禁忌：${input.bossPersona.avoidances || "未填写"}`,
        "",
        "原始输入：",
        formatFields(input.workInput.fields),
        input.workInput.extraText ? `\n补充材料：\n${input.workInput.extraText}` : "\n补充材料：未填写",
        "",
        "待评分报告：",
        input.content,
        "",
        "请输出 JSON，结构必须为：",
        `{"total": 0, "dimensions": [{"id": "boss_fit", "name": "老板适配度", "score": 0, "reason": "", "suggestion": ""}], "suggestions": [""], "summary": ""}`,
        "dimensions 必须包含 boss_fit、impact、data、clarity、risk、next_steps、factfulness 七项，分数 0-100。"
      ].join("\n")
    }
  ];
}

export function buildOptimizePrompt(input: {
  originalContent: string;
  score: ReportScore;
  report: ReportRecord;
}): Array<{ role: "system" | "user"; content: string }> {
  const preset = getRolePreset(input.report.rolePresetId);
  const playbook = getMarketPlaybook(input.report.input.playbookId);
  return [
    {
      role: "system",
      content: [
        "你是一位中文职场汇报润色专家。",
        "根据评分建议优化报告，但必须严格保留原始事实。",
        "不得新增未提供的数据、客户、收入、上线结果或收益。",
        "输出只能是优化后的 Markdown 正文。"
      ].join("\n")
    },
    {
      role: "user",
      content: [
        `岗位：${preset.name}`,
        `汇报打法：${playbook.name}；${playbook.generationRules.join("；")}`,
        `老板人设：${input.report.bossPersona.name}；${formatBossTags(input.report.bossPersona)}`,
        "",
        "原始事实输入：",
        formatFields(input.report.input.fields),
        input.report.input.extraText ? `\n补充材料：\n${input.report.input.extraText}` : "\n补充材料：未填写",
        "",
        "原稿：",
        input.originalContent,
        "",
        "评分：",
        `总分：${input.score.total}`,
        input.score.dimensions
          .map((dimension) => `- ${dimension.name} ${dimension.score}：${dimension.reason}；建议：${dimension.suggestion}`)
          .join("\n"),
        "",
        "优化要求：",
        "- 优先修复低分项。",
        "- 保持稳妥正式，可直接发给领导。",
        "- 没有量化数据时不要编造，写“暂无量化数据”或自然弱化。",
        "- 需要领导协调的事项要清晰。"
      ].join("\n")
    }
  ];
}

function formatBossTags(persona: BossPersona): string {
  return Object.entries(persona.tags)
    .map(([key, value]) => `${bossTagLabels[key as keyof typeof bossTagLabels]} ${value}`)
    .join("，");
}

function formatFields(fields: Record<string, string>): string {
  const entries = Object.entries(fields).filter(([, value]) => value?.trim());
  if (!entries.length) return "结构化字段：未填写";
  return entries.map(([key, value]) => `- ${key}：${value.trim()}`).join("\n");
}

function formatHistory(reports: ReportRecord[]): string {
  return reports
    .slice(0, 20)
    .map((report) => {
      const content = report.optimizedContent || report.content;
      return `【${reportTypeLabel(report.type)} ${report.periodStart} 至 ${report.periodEnd}】\n${content.slice(0, 1200)}`;
    })
    .join("\n\n");
}
