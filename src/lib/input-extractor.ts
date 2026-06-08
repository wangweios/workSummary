import { getRolePreset } from "@/lib/role-presets";

type ExtractedField = {
  value: string;
  confidence: number;
  matchedBy: string[];
};

const roleKeywordHints: Record<string, Record<string, string[]>> = {
  product_manager: {
    metric_changes: ["指标", "数据", "转化", "留存", "点击", "工单", "增长", "下降", "提升"],
    requirement_progress: ["需求", "PRD", "评审", "排期", "验收", "进展", "完成", "推进"],
    launch_result: ["上线", "灰度", "发布", "回滚", "影响范围"],
    user_feedback: ["用户", "客户", "客服", "反馈", "投诉", "建议"],
    decisions: ["决策", "确认", "拍板", "优先级", "取舍", "审批"],
    dependencies: ["依赖", "协作", "前端", "后端", "测试", "设计", "运营", "法务"]
  },
  frontend: {
    delivery: ["页面", "组件", "交付", "路由", "权限", "埋点", "完成"],
    interaction: ["交互", "体验", "加载", "空状态", "错误态", "移动端", "适配"],
    performance: ["性能", "首屏", "包体", "缓存", "懒加载", "渲染", "耗时"],
    compatibility: ["兼容", "浏览器", "机型", "分辨率", "暗色", "国际化"],
    production_issues: ["线上", "故障", "异常", "报错", "影响", "修复"],
    integration_blockers: ["联调", "接口", "字段", "环境", "阻塞", "依赖"]
  },
  backend: {
    api_delivery: ["接口", "服务", "任务", "权限", "消息", "回调", "交付"],
    stability: ["稳定", "错误率", "告警", "限流", "降级", "监控", "故障"],
    performance: ["性能", "耗时", "吞吐", "慢 SQL", "缓存", "队列"],
    data_work: ["数据", "表结构", "迁移", "修复", "口径", "一致性"],
    architecture: ["架构", "重构", "拆分", "技术债", "升级", "基础能力"],
    incident_risks: ["故障", "风险", "影响范围", "预案", "资源"]
  },
  qa: {
    test_scope: ["测试范围", "范围", "模块", "版本", "平台", "回归", "兼容"],
    case_execution: ["用例", "执行", "通过", "失败", "覆盖率", "进度"],
    defects: ["缺陷", "bug", "P0", "P1", "P2", "修复", "复现"],
    blockers: ["阻塞", "环境", "数据", "接口", "等待", "变更"],
    quality_risks: ["质量", "风险", "遗漏", "验证不足", "影响用户"],
    release_advice: ["上线建议", "上线", "灰度", "延后", "监控"]
  },
  sales: {
    leads: ["线索", "来源", "新增", "客户名单", "lead"],
    visits: ["拜访", "沟通", "会议", "关键人", "诉求", "客户"],
    pipeline: ["商机", "阶段", "报价", "合同", "签约", "复购"],
    revenue: ["成交", "金额", "收入", "回款", "签约额", "预计"],
    payment_risk: ["回款风险", "账期", "审批", "预算", "竞品", "合同条款"],
    customer_feedback: ["客户反馈", "价格", "功能", "服务", "竞品", "采购"],
    next_push: ["下周", "下一步", "推进", "约见", "报价", "催款", "资源"]
  }
};

export function extractWorkFields(input: { rolePresetId: string; text: string }) {
  const preset = getRolePreset(input.rolePresetId);
  const text = normalize(input.text);
  if (!text) {
    return { fields: {}, summary: "没有可拆解的材料。", matchedFieldCount: 0 };
  }

  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const sections = splitSections(lines);
  const fields: Record<string, ExtractedField> = {};

  for (const field of preset.fields) {
    const keywords = buildKeywords(input.rolePresetId, field.id, field.label);
    const exact = findExplicitSection(sections, keywords);
    const scored = exact || findScoredLines(lines, keywords);
    if (scored.value) {
      fields[field.id] = {
        value: trimValue(scored.value),
        confidence: scored.confidence,
        matchedBy: scored.matchedBy
      };
    }
  }

  const matchedFieldCount = Object.keys(fields).length;
  return {
    fields,
    summary: matchedFieldCount
      ? `已从粘贴材料中拆出 ${matchedFieldCount} 个字段草稿。`
      : "未识别到明确字段，建议补充更具体的成果、数据、风险或下一步。",
    matchedFieldCount
  };
}

function normalize(text: string) {
  return String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\t/g, " ")
    .trim();
}

function buildKeywords(rolePresetId: string, fieldId: string, label: string) {
  const hints = roleKeywordHints[rolePresetId]?.[fieldId] || [];
  return Array.from(new Set([fieldId, label, ...hints].filter(Boolean)));
}

function splitSections(lines: string[]) {
  const sections: Array<{ title: string; body: string }> = [];
  let current: { title: string; body: string[] } | null = null;
  const titlePattern = /^[-*#\s]*(.{2,18}?)(?:[:：]|$)/;

  for (const line of lines) {
    const titleMatch = line.match(titlePattern);
    const looksLikeTitle = Boolean(titleMatch && /[:：]$/.test(line.slice(0, Math.min(line.length, 24))));
    if (looksLikeTitle) {
      if (current) sections.push({ title: current.title, body: current.body.join("\n") });
      const [title, rest = ""] = line.split(/[:：](.*)/s);
      current = { title: title.replace(/^[-*#\s]+/, "").trim(), body: [rest.trim()].filter(Boolean) };
    } else if (current) {
      current.body.push(line);
    }
  }
  if (current) sections.push({ title: current.title, body: current.body.join("\n") });
  return sections;
}

function findExplicitSection(sections: Array<{ title: string; body: string }>, keywords: string[]) {
  for (const section of sections) {
    const matchedBy = keywords.filter((keyword) => section.title.includes(keyword));
    if (matchedBy.length && section.body.trim()) {
      return { value: section.body, confidence: 92, matchedBy };
    }
  }
  return null;
}

function findScoredLines(lines: string[], keywords: string[]) {
  const matched: string[] = [];
  const matchedBy = new Set<string>();
  for (const line of lines) {
    const lineMatches = keywords.filter((keyword) => keyword && line.toLowerCase().includes(keyword.toLowerCase()));
    if (lineMatches.length) {
      matched.push(line.replace(/^[-*]\s*/, ""));
      lineMatches.forEach((keyword) => matchedBy.add(keyword));
    }
  }

  if (!matched.length) return { value: "", confidence: 0, matchedBy: [] };
  const confidence = Math.min(88, 50 + matchedBy.size * 8 + matched.length * 4);
  return {
    value: matched.slice(0, 5).join("\n"),
    confidence,
    matchedBy: Array.from(matchedBy).slice(0, 6)
  };
}

function trimValue(value: string) {
  return value
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 8)
    .join("\n");
}
