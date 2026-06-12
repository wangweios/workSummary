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
  preflightSignals: Array<{
    id: string;
    label: string;
    pattern: RegExp;
    missingMessage: string;
    suggestion: string;
  }>;
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
    preflightSignals: [
      {
        id: "health",
        label: "整体状态",
        pattern: /整体|状态|健康度|结论|正常|延期|风险|on track|at risk|behind/i,
        missingMessage: "缺少一眼能看懂的整体状态。",
        suggestion: "补充“整体正常/有风险/需关注”的判断，并说明最关键原因。"
      },
      {
        id: "priority",
        label: "关键优先级",
        pattern: /重点|关键|优先级|核心|top|priority|最重要/i,
        missingMessage: "缺少高层快读需要的关键优先级。",
        suggestion: "只写 1-3 个最重要事项，避免把所有过程都堆进去。"
      },
      {
        id: "support",
        label: "需要关注",
        pattern: /支持|协调|决策|确认|审批|资源|暂无需领导|support|decision/i,
        missingMessage: "没有说明是否需要领导关注或介入。",
        suggestion: "如果需要支持，写清楚决策点；如果不需要，明确写暂无需领导额外协调。"
      }
    ],
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
    preflightSignals: [
      {
        id: "impact",
        label: "影响范围",
        pattern: /影响|范围|用户|客户|收入|上线|延期|scope|impact/i,
        missingMessage: "风险已提到但影响范围不够清楚。",
        suggestion: "补充影响谁、影响多大、影响到哪个时间点或交付节点。"
      },
      {
        id: "mitigation",
        label: "处理预案",
        pattern: /预案|方案|处理|修复|规避|降级|回滚|mitigation|workaround|fix/i,
        missingMessage: "缺少风险处理动作或预案。",
        suggestion: "写清楚当前已经做什么、下一步怎么处理、何时复查。"
      },
      {
        id: "owner",
        label: "协同对象",
        pattern: /负责人|同事|研发|测试|产品|销售|客户|法务|财务|owner|team|协同/i,
        missingMessage: "缺少需要谁协同或介入的信息。",
        suggestion: "说明需要哪个人或团队处理，避免领导不知道该推动谁。"
      }
    ],
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
    preflightSignals: [
      {
        id: "outcome",
        label: "可验证成果",
        pattern: /完成|上线|交付|达成|修复|发布|节省|提升|增长|shipped|delivered|improved/i,
        missingMessage: "缺少可验证成果，容易写成过程流水。",
        suggestion: "把动作改写成产出，例如交付了什么、解决了什么、带来什么变化。"
      },
      {
        id: "evidence",
        label: "事实证据",
        pattern: /\d|%|比例|金额|元|万|小时|分钟|条|个|次|率|metric|data/i,
        missingMessage: "成果缺少数据或事实证据。",
        suggestion: "补充数量、比例、完成率、耗时、金额或明确写暂无量化数据。"
      },
      {
        id: "next_commitment",
        label: "下周期承诺",
        pattern: /下周|下月|下一步|计划|承诺|推进|目标|next|plan/i,
        missingMessage: "缺少下周期可检查的承诺。",
        suggestion: "补充下周期要完成的动作、验收口径和时间点。"
      }
    ],
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
    preflightSignals: [
      {
        id: "customer_stage",
        label: "客户与阶段",
        pattern: /客户|线索|拜访|商机|阶段|报价|合同|续费|pipeline|lead|deal|customer/i,
        missingMessage: "缺少客户或商机阶段，销售汇报会变得空泛。",
        suggestion: "补充客户名称/类型、当前阶段、关键人和本次推进结果。"
      },
      {
        id: "money",
        label: "金额与转化",
        pattern: /金额|成交|收入|回款|预算|报价|万|元|转化|revenue|payment|amount/i,
        missingMessage: "缺少金额、转化或回款信息。",
        suggestion: "补充已成交/预计签约/待回款金额；没有成交时写暂无成交金额。"
      },
      {
        id: "next_push",
        label: "下步推进",
        pattern: /下周|下一步|跟进|约见|报价|催款|推进|确认|next|follow/i,
        missingMessage: "缺少下一步客户推进动作。",
        suggestion: "补充下次沟通时间、推进动作、需要领导支持的客户或资源。"
      }
    ],
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
    preflightSignals: [
      {
        id: "scope",
        label: "覆盖范围",
        pattern: /范围|覆盖|模块|版本|平台|回归|测试|scope|coverage/i,
        missingMessage: "缺少测试或发布覆盖范围。",
        suggestion: "补充验证了哪些模块、平台、版本、回归范围，未覆盖也要说明。"
      },
      {
        id: "defects",
        label: "缺陷与质量证据",
        pattern: /缺陷|bug|P0|P1|P2|通过|失败|用例|覆盖率|告警|质量|case/i,
        missingMessage: "缺少缺陷、用例或质量证据。",
        suggestion: "补充用例执行、缺陷分布、严重问题状态或暂无关键缺陷。"
      },
      {
        id: "release_advice",
        label: "发布建议",
        pattern: /上线|发布|灰度|回滚|遗留|建议|风险|release|rollout/i,
        missingMessage: "缺少上线/发布判断。",
        suggestion: "明确建议上线、灰度、延期或补充验证，并说明依据和遗留风险。"
      }
    ],
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
