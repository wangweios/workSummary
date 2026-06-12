import type { ReportType, ScoreDimensionId } from "@/lib/types";

export type MarketPlaybookId =
  | "executive_brief"
  | "risk_blocker"
  | "outcome_proof"
  | "customer_revenue"
  | "quality_release";

export interface MarketPlaybook {
  id: MarketPlaybookId;
  name: string;
  shortName: string;
  summary: string;
  bestFor: ReportType[];
  sourceProducts: string[];
  marketSignals: string[];
  generationRules: string[];
  scoreEmphasis: ScoreDimensionId[];
  fallbackSections: string[];
}

export const marketPlaybooks: MarketPlaybook[] = [
  {
    id: "executive_brief",
    name: "高层快读",
    shortName: "快读",
    summary: "先给健康度、结论和需要关注的事项，适合发给时间很少的老板。",
    bestFor: ["daily", "weekly", "monthly"],
    sourceProducts: ["Asana status reports", "Range check-ins"],
    marketSignals: ["项目健康度", "关键进展", "阻塞/风险", "下一步和负责人"],
    generationRules: [
      "开头用一句话说明整体状态和本周期最重要判断。",
      "只保留领导必须知道的三到五个要点。",
      "需要支持的事项必须单独列出，没有则明确写暂无。"
    ],
    scoreEmphasis: ["boss_fit", "clarity", "impact", "next_steps"],
    fallbackSections: ["整体状态", "关键成果", "风险/阻塞", "下一步", "需要支持"]
  },
  {
    id: "risk_blocker",
    name: "风险预警",
    shortName: "预警",
    summary: "把阻塞、影响面、预案和需要谁介入讲清楚，适合项目有不确定性时使用。",
    bestFor: ["daily", "weekly"],
    sourceProducts: ["Dailybot blocker triage", "Geekbot async standups", "TestingDocs WSR"],
    marketSignals: ["阻塞自动浮出", "影响范围", "解决方案", "升级路径"],
    generationRules: [
      "风险和阻塞前置，避免藏在成果后面。",
      "每个风险都说明状态、影响、当前处理动作和需要的外部支持。",
      "不能把未解决风险写成已经解决。"
    ],
    scoreEmphasis: ["risk", "factfulness", "next_steps", "boss_fit"],
    fallbackSections: ["风险概览", "阻塞明细", "当前预案", "需要协同", "下一步"]
  },
  {
    id: "outcome_proof",
    name: "成果证明",
    shortName: "成果",
    summary: "把动作翻译成可判断的产出、指标、业务影响和机会，适合周报/月报。",
    bestFor: ["weekly", "monthly"],
    sourceProducts: ["LION Report", "Asana status reports"],
    marketSignals: ["上周期成果", "问题处理", "机会发现", "下周期承诺"],
    generationRules: [
      "优先写可验证成果，再写过程动作。",
      "没有数据时写暂无量化数据，并给出建议补充项。",
      "加入机会或改进洞察，但必须来自用户输入。"
    ],
    scoreEmphasis: ["impact", "data", "factfulness", "clarity"],
    fallbackSections: ["成果结论", "事实依据", "问题处理", "机会/洞察", "下周期承诺"]
  },
  {
    id: "customer_revenue",
    name: "客户/收入推进",
    shortName: "客户",
    summary: "围绕客户、商机阶段、金额、转化和回款风险组织内容，适合销售和业务岗位。",
    bestFor: ["daily", "weekly", "monthly"],
    sourceProducts: ["Enerpize sales report", "Geekbot sales report template"],
    marketSignals: ["活动量", "商机推进", "成交/收入", "目标差距", "客户反馈"],
    generationRules: [
      "客户和金额相关信息前置，未成交不能写成已成交。",
      "同时呈现动作量和结果量，避免只写拜访流水。",
      "回款、合同、竞品和关键人变化要转成风险与下一步。"
    ],
    scoreEmphasis: ["impact", "data", "risk", "next_steps"],
    fallbackSections: ["客户推进", "商机与金额", "客户反馈", "回款/合同风险", "下步动作"]
  },
  {
    id: "quality_release",
    name: "质量/发布判断",
    shortName: "质量",
    summary: "突出测试覆盖、缺陷、发布建议和遗留风险，适合测试、研发上线前后汇报。",
    bestFor: ["daily", "weekly", "monthly"],
    sourceProducts: ["TestingDocs WSR", "Asana status reports"],
    marketSignals: ["测试范围", "缺陷分布", "告警事项", "上线建议", "遗留交付"],
    generationRules: [
      "先给质量结论或发布建议，再展开证据。",
      "缺陷、覆盖、阻塞和遗留事项要有状态和影响。",
      "上线建议必须克制，不能掩盖未验证范围。"
    ],
    scoreEmphasis: ["risk", "data", "factfulness", "next_steps"],
    fallbackSections: ["质量结论", "覆盖与缺陷", "阻塞/告警", "上线建议", "遗留事项"]
  }
];

export function getMarketPlaybook(id?: string): MarketPlaybook {
  return marketPlaybooks.find((playbook) => playbook.id === id) ?? marketPlaybooks[0];
}
