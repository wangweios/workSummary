import { getMarketPlaybook, marketPlaybooks, type MarketPlaybookId } from "@/lib/market-playbooks";
import type { ReportType, WorkInput } from "@/lib/types";

type ScoreMap = Record<MarketPlaybookId, number>;

export interface PlaybookRecommendation {
  playbookId: MarketPlaybookId;
  playbookName: string;
  confidence: number;
  reasons: string[];
  signals: string[];
  alternatives: Array<{
    playbookId: MarketPlaybookId;
    playbookName: string;
    score: number;
  }>;
  scores: ScoreMap;
}

const baseScores: ScoreMap = {
  executive_brief: 18,
  risk_blocker: 8,
  outcome_proof: 12,
  customer_revenue: 6,
  quality_release: 7
};

const roleScores: Record<string, Partial<ScoreMap>> = {
  product_manager: {
    executive_brief: 12,
    outcome_proof: 16,
    risk_blocker: 10
  },
  frontend: {
    quality_release: 14,
    risk_blocker: 12,
    outcome_proof: 10
  },
  backend: {
    risk_blocker: 16,
    quality_release: 14,
    outcome_proof: 8
  },
  qa: {
    quality_release: 34,
    risk_blocker: 16
  },
  sales: {
    customer_revenue: 38,
    outcome_proof: 8,
    executive_brief: 6
  }
};

const reportTypeScores: Record<ReportType, Partial<ScoreMap>> = {
  daily: {
    executive_brief: 10,
    risk_blocker: 7
  },
  weekly: {
    outcome_proof: 15,
    customer_revenue: 7,
    quality_release: 6
  },
  monthly: {
    outcome_proof: 18,
    executive_brief: 9,
    customer_revenue: 7
  }
};

const keywordSignals: Array<{
  playbookId: MarketPlaybookId;
  points: number;
  label: string;
  pattern: RegExp;
}> = [
  {
    playbookId: "risk_blocker",
    points: 24,
    label: "发现风险/阻塞/延期信号",
    pattern: /风险|阻塞|卡住|延期|依赖|故障|事故|告警|等待|审批|升级|blocker|blocked|delay|incident|issue/i
  },
  {
    playbookId: "customer_revenue",
    points: 26,
    label: "发现客户/收入/回款信号",
    pattern: /客户|商机|线索|拜访|成交|金额|报价|合同|回款|续费|采购|竞品|pipeline|revenue|deal|contract|payment/i
  },
  {
    playbookId: "quality_release",
    points: 24,
    label: "发现质量/缺陷/发布信号",
    pattern: /测试|用例|缺陷|覆盖|回归|上线|发布|灰度|P0|P1|bug|coverage|release|regression|staging/i
  },
  {
    playbookId: "outcome_proof",
    points: 18,
    label: "发现成果/指标/业务影响信号",
    pattern: /成果|完成|上线|增长|转化|指标|节省|提升|收入|效率|交付|impact|metric|conversion|growth|shipped/i
  },
  {
    playbookId: "executive_brief",
    points: 14,
    label: "发现决策/高层快读信号",
    pattern: /领导|老板|决策|拍板|支持|协调|健康度|结论|简洁|executive|decision|support/i
  }
];

export function recommendMarketPlaybook(input: {
  rolePresetId: string;
  reportType: ReportType;
  workInput?: Partial<WorkInput>;
}): PlaybookRecommendation {
  const scores: ScoreMap = { ...baseScores };
  const reasonsByPlaybook: Record<MarketPlaybookId, string[]> = {
    executive_brief: ["默认保证领导能快速读到结论。"],
    risk_blocker: [],
    outcome_proof: [],
    customer_revenue: [],
    quality_release: []
  };
  const signals: string[] = [];

  applyScores(scores, roleScores[input.rolePresetId] || {}, reasonsByPlaybook, roleReason(input.rolePresetId));
  applyScores(scores, reportTypeScores[input.reportType] || {}, reasonsByPlaybook, reportTypeReason(input.reportType));

  const text = collectWorkText(input.workInput);
  for (const signal of keywordSignals) {
    if (signal.pattern.test(text)) {
      scores[signal.playbookId] += signal.points;
      reasonsByPlaybook[signal.playbookId].push(signal.label);
      signals.push(signal.label);
    }
  }

  for (const playbook of marketPlaybooks) {
    if (playbook.bestFor.includes(input.reportType)) {
      scores[playbook.id] += 4;
    }
  }

  const ranked = marketPlaybooks
    .map((playbook) => ({
      playbookId: playbook.id,
      playbookName: playbook.name,
      score: Math.round(scores[playbook.id])
    }))
    .sort((a, b) => b.score - a.score);
  const winner = ranked[0];
  const runnerUp = ranked[1];
  const spread = Math.max(0, winner.score - (runnerUp?.score ?? 0));
  const confidence = clamp(58 + spread + Math.floor(winner.score / 8), 58, 94);
  const playbook = getMarketPlaybook(winner.playbookId);

  return {
    playbookId: winner.playbookId,
    playbookName: playbook.name,
    confidence,
    reasons: (reasonsByPlaybook[winner.playbookId].length ? reasonsByPlaybook[winner.playbookId] : ["当前输入更适合使用该结构组织汇报。"]).slice(0, 4),
    signals: signals.slice(0, 5),
    alternatives: ranked.slice(1, 3),
    scores
  };
}

function applyScores(
  scores: ScoreMap,
  additions: Partial<ScoreMap>,
  reasonsByPlaybook: Record<MarketPlaybookId, string[]>,
  reason: string
) {
  for (const [id, points] of Object.entries(additions) as Array<[MarketPlaybookId, number]>) {
    scores[id] += points;
    if (points > 0) reasonsByPlaybook[id].push(reason);
  }
}

function roleReason(rolePresetId: string) {
  const labels: Record<string, string> = {
    product_manager: "产品岗位通常需要兼顾目标、成果和跨团队风险。",
    frontend: "前端岗位通常需要把交付、体验、联调和发布质量讲清楚。",
    backend: "后端岗位通常需要前置稳定性、依赖和影响面。",
    qa: "测试岗位通常需要优先给出质量结论和上线判断。",
    sales: "销售岗位通常需要围绕客户、金额、阶段和回款推进。"
  };
  return labels[rolePresetId] || "当前岗位需要选择能突出管理关注点的结构。";
}

function reportTypeReason(reportType: ReportType) {
  const labels: Record<ReportType, string> = {
    daily: "日报更适合快速同步状态、阻塞和下一步。",
    weekly: "周报更适合沉淀成果、趋势、风险闭环和下周重点。",
    monthly: "月报更适合总结阶段成果、目标差距和下月策略。"
  };
  return labels[reportType];
}

function collectWorkText(workInput?: Partial<WorkInput>) {
  if (!workInput) return "";
  return [workInput.reportType, Object.values(workInput.fields || {}).join("\n"), workInput.extraText || ""].join("\n");
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
