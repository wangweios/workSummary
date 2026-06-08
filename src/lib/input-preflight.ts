import { getRolePreset } from "@/lib/role-presets";
import type { WorkInput } from "@/lib/types";

export type PreflightSeverity = "ok" | "warn" | "missing";

export interface PreflightCheck {
  id: string;
  label: string;
  severity: PreflightSeverity;
  message: string;
  suggestion: string;
}

const dataPattern = /\d|%|百分比|金额|元|万|小时|分钟|天|条|个|次|率|P0|P1|P2|SQL|耗时|收入|回款|线索|用例|缺陷/;
const riskPattern = /风险|问题|阻塞|依赖|延迟|延期|故障|异常|待确认|未确认|回款|审批|质量|遗漏/;
const nextPattern = /下一步|明天|下周|计划|推进|完成|跟进|约见|回归|上线|灰度|确认|提交|修复/;
const supportPattern = /领导|支持|协调|决策|确认|审批|资源|拍板|优先级/;

export function analyzeWorkInput(input: {
  rolePresetId: string;
  workInput: WorkInput;
}) {
  const preset = getRolePreset(input.rolePresetId);
  const fields = input.workInput.fields || {};
  const text = Object.values(fields).join("\n") + "\n" + (input.workInput.extraText || "");
  const filledFields = Object.values(fields).filter((value) => String(value || "").trim()).length;
  const requiredFields = preset.fields.filter((field) => field.required);
  const checks: PreflightCheck[] = [];

  for (const field of requiredFields) {
    const value = String(fields[field.label] ?? fields[field.id] ?? "").trim();
    checks.push({
      id: `required_${field.id}`,
      label: `${field.label}必填`,
      severity: value ? "ok" : "missing",
      message: value ? "已填写核心字段。" : `缺少${field.label}，生成结果容易空泛。`,
      suggestion: value ? "保持事实清晰即可。" : `请补充${field.label}的事实、状态和影响。`
    });
  }

  checks.push(buildPatternCheck({
    id: "data",
    label: "数据支撑",
    matched: dataPattern.test(text),
    missingMessage: "缺少可验证数据，报告容易像过程描述。",
    missingSuggestion: "补充数量、比例、金额、耗时、用例数、缺陷数、完成率等；没有就写暂无量化数据。"
  }));
  checks.push(buildPatternCheck({
    id: "risk",
    label: "风险问题",
    matched: riskPattern.test(text),
    missingMessage: "没有看到风险、问题或依赖说明。",
    missingSuggestion: "如果确实无风险，可写暂无明确风险；如有延期、质量、客户、回款或协作问题，请说明影响范围和预案。"
  }));
  checks.push(buildPatternCheck({
    id: "next_steps",
    label: "下一步",
    matched: nextPattern.test(text),
    missingMessage: "缺少下一步动作，领导难以判断后续推进。",
    missingSuggestion: "补充下个动作、时间点、负责人、验收口径或需要谁配合。"
  }));
  checks.push({
    id: "leader_support",
    label: "领导支持",
    severity: supportPattern.test(text) ? "ok" : "warn",
    message: supportPattern.test(text) ? "已说明需要领导关注或确认的事项。" : "暂未说明是否需要领导支持。",
    suggestion: supportPattern.test(text) ? "保持诉求明确。" : "如果不需要支持，可写暂无需领导额外协调；如果需要，请写清楚决策点或资源诉求。"
  });
  checks.push({
    id: "coverage",
    label: "岗位字段覆盖",
    severity: filledFields >= Math.min(3, preset.fields.length) ? "ok" : filledFields >= 1 ? "warn" : "missing",
    message: `当前已填写 ${filledFields}/${preset.fields.length} 个岗位字段。`,
    suggestion: filledFields >= 3 ? "覆盖度足够生成初稿。" : "建议至少补齐 3 个字段，尤其是成果、风险和下一步。"
  });

  const score = Math.round(
    checks.reduce((sum, check) => sum + (check.severity === "ok" ? 100 : check.severity === "warn" ? 62 : 20), 0) /
      checks.length
  );

  return {
    score,
    ready: score >= 72 && checks.every((check) => check.severity !== "missing"),
    checks,
    summary:
      score >= 82
        ? "输入材料较完整，可以生成质量较好的汇报。"
        : score >= 60
          ? "输入材料基本可用，建议先补齐黄色/红色项再生成。"
          : "输入材料偏少，建议补充成果、数据、风险和下一步后再生成。"
  };
}

function buildPatternCheck(input: {
  id: string;
  label: string;
  matched: boolean;
  missingMessage: string;
  missingSuggestion: string;
}): PreflightCheck {
  return {
    id: input.id,
    label: input.label,
    severity: input.matched ? "ok" : "warn",
    message: input.matched ? "已识别到相关信息。" : input.missingMessage,
    suggestion: input.matched ? "继续保持具体表达。" : input.missingSuggestion
  };
}
