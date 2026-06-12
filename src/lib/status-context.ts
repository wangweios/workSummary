import type { ReportHealth, WorkInput } from "@/lib/types";

export const reportHealthOptions: Array<{
  id: ReportHealth;
  label: string;
  summary: string;
  promptHint: string;
}> = [
  {
    id: "unknown",
    label: "未判断",
    summary: "暂不声明整体状态",
    promptHint: "用户未判断整体状态，生成时不得编造健康度。"
  },
  {
    id: "on_track",
    label: "正常推进",
    summary: "整体按计划推进",
    promptHint: "整体状态为正常推进，可在开头说明当前按计划推进。"
  },
  {
    id: "attention",
    label: "需关注",
    summary: "存在需要持续跟踪的不确定因素",
    promptHint: "整体状态需关注，应说明关注点、当前影响和跟踪动作。"
  },
  {
    id: "at_risk",
    label: "有风险",
    summary: "目标、交付、质量或收入存在明显风险",
    promptHint: "整体状态有风险，应前置风险、影响范围、预案和需要协同对象。"
  },
  {
    id: "blocked",
    label: "已阻塞",
    summary: "需要外部协同、资源或决策才能继续推进",
    promptHint: "整体状态已阻塞，应直接说明阻塞原因、影响和需要谁介入。"
  }
];

export function getReportHealthOption(id?: string) {
  return reportHealthOptions.find((option) => option.id === id) ?? reportHealthOptions[0];
}

export function formatStatusContext(workInput: Partial<WorkInput>) {
  const health = getReportHealthOption(workInput.statusHealth);
  const goal = workInput.goalStatement?.trim() || "未填写";
  const decision = workInput.decisionRequest?.trim() || "未填写";
  return [
    `- 整体状态：${health.label}（${health.summary}）`,
    `- 状态写作约束：${health.promptHint}`,
    `- 本周期目标/对齐目标：${goal}`,
    `- 需要领导决策/支持：${decision}`
  ].join("\n");
}

export function collectStatusContextText(workInput: Partial<WorkInput>) {
  const health = getReportHealthOption(workInput.statusHealth);
  return [
    health.id === "unknown" ? "" : `${health.label} ${health.summary}`,
    workInput.goalStatement || "",
    workInput.decisionRequest || ""
  ].join("\n");
}
