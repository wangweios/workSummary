import type { BossTagId, RolePreset, ScoreDimensionId } from "@/lib/types";

export const scoreDimensionLabels: Record<ScoreDimensionId, string> = {
  boss_fit: "老板适配度",
  impact: "成果表达",
  data: "数据支撑",
  clarity: "结构清晰度",
  risk: "风险透明度",
  next_steps: "下一步可执行性",
  factfulness: "事实忠实度"
};

export const bossTagLabels: Record<BossTagId, string> = {
  result: "结果导向",
  data: "数据敏感",
  risk: "风险敏感",
  concise: "喜欢简洁",
  process: "关注过程",
  customer: "关注客户",
  cost: "关注成本",
  collaboration: "关注协作"
};

const balancedWeights: Record<ScoreDimensionId, number> = {
  boss_fit: 16,
  impact: 18,
  data: 14,
  clarity: 14,
  risk: 12,
  next_steps: 14,
  factfulness: 12
};

export const rolePresets: RolePreset[] = [
  {
    id: "product_manager",
    name: "产品经理",
    shortName: "产品",
    summary: "强调指标、需求推进、用户反馈、决策事项和跨团队协作。",
    fieldHint: "把需求价值、当前状态、影响面和需要拍板的点讲清楚。",
    fields: [
      {
        id: "metric_changes",
        label: "指标变化",
        placeholder: "例如：转化率、留存、点击率、工单量、活跃用户变化；没有就写暂无量化数据。",
        kind: "metrics"
      },
      {
        id: "requirement_progress",
        label: "需求推进",
        placeholder: "例如：完成 PRD、评审、排期、验收、上线、灰度等进展。",
        kind: "long",
        required: true
      },
      {
        id: "launch_result",
        label: "上线结果",
        placeholder: "例如：上线范围、用户影响、已发现问题、回滚预案。",
        kind: "long"
      },
      {
        id: "user_feedback",
        label: "用户反馈",
        placeholder: "例如：客户/用户/客服/销售反馈，正负反馈都写。",
        kind: "long"
      },
      {
        id: "decisions",
        label: "决策事项",
        placeholder: "例如：需要领导确认优先级、资源、方案取舍或上线窗口。",
        kind: "long"
      },
      {
        id: "dependencies",
        label: "跨团队依赖",
        placeholder: "例如：依赖研发、设计、测试、运营、法务、数据等支持。",
        kind: "long"
      }
    ],
    reportGuidance: {
      daily: ["先讲影响业务目标的进展", "决策事项必须单独列出", "指标缺失时不要编造"],
      weekly: ["聚合需求状态和上线结果", "突出用户反馈和指标变化", "明确下周优先级"],
      monthly: ["总结产品目标达成度", "呈现关键实验/上线的业务影响", "沉淀下月策略取舍"]
    },
    scoreWeights: {
      ...balancedWeights,
      boss_fit: 15,
      impact: 20,
      data: 18,
      clarity: 13,
      risk: 10,
      next_steps: 14,
      factfulness: 10
    }
  },
  {
    id: "frontend",
    name: "前端工程师",
    shortName: "前端",
    summary: "强调页面交付、体验质量、性能、兼容性、联调和线上问题。",
    fieldHint: "用业务页面、交互体验、质量风险和联调阻塞来表达技术工作价值。",
    fields: [
      {
        id: "delivery",
        label: "页面/组件交付",
        placeholder: "例如：完成页面、组件、埋点、路由、权限、状态管理等。",
        kind: "long",
        required: true
      },
      {
        id: "interaction",
        label: "交互体验",
        placeholder: "例如：优化表单、动效、空状态、加载态、错误态、移动端适配。",
        kind: "long"
      },
      {
        id: "performance",
        label: "性能优化",
        placeholder: "例如：首屏、包体、缓存、懒加载、渲染次数、接口并发。",
        kind: "metrics"
      },
      {
        id: "compatibility",
        label: "兼容性",
        placeholder: "例如：浏览器、机型、分辨率、暗色模式、国际化等。",
        kind: "long"
      },
      {
        id: "production_issues",
        label: "线上问题",
        placeholder: "例如：问题现象、影响范围、修复状态、规避方案。",
        kind: "long"
      },
      {
        id: "integration_blockers",
        label: "联调阻塞",
        placeholder: "例如：接口字段、测试环境、后端依赖、设计稿变更。",
        kind: "long"
      }
    ],
    reportGuidance: {
      daily: ["把交付物和业务页面对应起来", "不要只写技术动作", "阻塞要说明影响范围"],
      weekly: ["汇总页面交付和体验改进", "突出性能和线上质量", "列出下周联调/上线风险"],
      monthly: ["体现前端交付对业务效率和用户体验的影响", "沉淀质量、性能和工程化收益", "规划下月关键页面/架构工作"]
    },
    scoreWeights: {
      ...balancedWeights,
      boss_fit: 14,
      impact: 18,
      data: 14,
      clarity: 14,
      risk: 14,
      next_steps: 14,
      factfulness: 12
    }
  },
  {
    id: "backend",
    name: "后端工程师",
    shortName: "后端",
    summary: "强调接口服务、稳定性、性能、数据、架构改造和故障风险。",
    fieldHint: "把服务能力、稳定性、性能收益和风险控制讲成领导能判断的业务影响。",
    fields: [
      {
        id: "api_delivery",
        label: "接口/服务交付",
        placeholder: "例如：新增接口、服务、任务、权限、消息、审批、回调等。",
        kind: "long",
        required: true
      },
      {
        id: "stability",
        label: "稳定性",
        placeholder: "例如：错误率、告警、限流、降级、故障修复、监控完善。",
        kind: "metrics"
      },
      {
        id: "performance",
        label: "性能",
        placeholder: "例如：耗时、吞吐、慢 SQL、缓存命中率、队列堆积。",
        kind: "metrics"
      },
      {
        id: "data_work",
        label: "数据工作",
        placeholder: "例如：表结构、迁移、数据修复、报表口径、数据一致性。",
        kind: "long"
      },
      {
        id: "architecture",
        label: "架构改造",
        placeholder: "例如：拆分、重构、技术债治理、依赖升级、基础能力建设。",
        kind: "long"
      },
      {
        id: "incident_risks",
        label: "故障风险",
        placeholder: "例如：潜在风险、影响范围、预案、需要协调的资源。",
        kind: "long"
      }
    ],
    reportGuidance: {
      daily: ["用服务能力和业务影响表达后端进展", "稳定性风险要前置", "性能数字没有就说明暂无量化数据"],
      weekly: ["汇总接口交付、稳定性和故障处理", "说明架构改造收益而非只写重构", "明确下周上线/迁移风险"],
      monthly: ["总结系统能力提升和质量收益", "量化稳定性、性能或成本变化", "规划技术债和业务支撑重点"]
    },
    scoreWeights: {
      ...balancedWeights,
      boss_fit: 14,
      impact: 17,
      data: 16,
      clarity: 12,
      risk: 18,
      next_steps: 11,
      factfulness: 12
    }
  },
  {
    id: "qa",
    name: "测试工程师",
    shortName: "测试",
    summary: "强调测试范围、用例执行、缺陷分布、阻塞问题、质量风险和上线建议。",
    fieldHint: "把质量结论、风险判断和上线建议写得清晰可决策。",
    fields: [
      {
        id: "test_scope",
        label: "测试范围",
        placeholder: "例如：模块、需求、版本、平台、回归范围、兼容范围。",
        kind: "long",
        required: true
      },
      {
        id: "case_execution",
        label: "用例执行",
        placeholder: "例如：用例总数、通过数、失败数、执行进度、覆盖率。",
        kind: "metrics"
      },
      {
        id: "defects",
        label: "缺陷分布",
        placeholder: "例如：P0/P1/P2 数量、已修复、待修复、复现难点。",
        kind: "metrics"
      },
      {
        id: "blockers",
        label: "阻塞问题",
        placeholder: "例如：环境、数据、接口、需求变更、研发修复等待。",
        kind: "long"
      },
      {
        id: "quality_risks",
        label: "质量风险",
        placeholder: "例如：上线风险、影响用户、遗漏风险、验证不足点。",
        kind: "long"
      },
      {
        id: "release_advice",
        label: "上线建议",
        placeholder: "例如：建议上线、延后、灰度、补充验证或增加监控。",
        kind: "long"
      }
    ],
    reportGuidance: {
      daily: ["优先给出质量判断", "缺陷和阻塞要有状态", "上线建议要明确"],
      weekly: ["汇总测试覆盖和缺陷趋势", "突出质量风险与风险关闭情况", "给出下周验证重点"],
      monthly: ["总结版本质量、缺陷结构和上线风险控制", "沉淀流程改进点", "规划下月质量保障重点"]
    },
    scoreWeights: {
      ...balancedWeights,
      boss_fit: 13,
      impact: 15,
      data: 17,
      clarity: 13,
      risk: 20,
      next_steps: 12,
      factfulness: 10
    }
  },
  {
    id: "sales",
    name: "业务销售",
    shortName: "销售",
    summary: "强调线索、拜访、商机阶段、成交金额、回款风险、客户反馈和推进动作。",
    fieldHint: "围绕收入、客户推进、风险和下步动作来写，少写流水账。",
    fields: [
      {
        id: "leads",
        label: "线索",
        placeholder: "例如：新增线索、来源、质量、重点客户名单。",
        kind: "metrics"
      },
      {
        id: "visits",
        label: "拜访/沟通",
        placeholder: "例如：拜访客户、会议纪要、关键人、客户诉求。",
        kind: "long",
        required: true
      },
      {
        id: "pipeline",
        label: "商机阶段",
        placeholder: "例如：初步沟通、方案、报价、合同、签约、复购。",
        kind: "long"
      },
      {
        id: "revenue",
        label: "成交/金额",
        placeholder: "例如：成交额、预计签约额、回款额、缺口；没有就写暂无成交。",
        kind: "metrics"
      },
      {
        id: "payment_risk",
        label: "回款风险",
        placeholder: "例如：账期、审批、预算、竞品、合同条款、关键人变化。",
        kind: "long"
      },
      {
        id: "customer_feedback",
        label: "客户反馈",
        placeholder: "例如：价格、功能、服务、竞品、采购流程、满意度。",
        kind: "long"
      },
      {
        id: "next_push",
        label: "下周推进",
        placeholder: "例如：约见、报价、方案调整、催款、协调资源。",
        kind: "long"
      }
    ],
    reportGuidance: {
      daily: ["优先呈现客户推进和收入影响", "风险要对应具体客户或商机", "下一步动作要能检查"],
      weekly: ["按商机阶段总结推进", "突出金额、转化和回款风险", "明确需要领导支持的客户/资源"],
      monthly: ["总结业绩完成度、商机结构和客户反馈", "呈现回款和收入风险", "规划下月重点客户和打法"]
    },
    scoreWeights: {
      ...balancedWeights,
      boss_fit: 14,
      impact: 22,
      data: 18,
      clarity: 12,
      risk: 12,
      next_steps: 12,
      factfulness: 10
    }
  }
];

export function getRolePreset(id: string): RolePreset {
  return rolePresets.find((preset) => preset.id === id) ?? rolePresets[0];
}
