"use client";

import {
  AlertCircle,
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronRight,
  Clipboard,
  Compass,
  Copy,
  Database,
  Download,
  Gauge,
  ListChecks,
  MessageSquareText,
  PlugZap,
  RefreshCcw,
  Save,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRoundCog,
  WandSparkles
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { BossPersona, BossTagId, ProviderInfo, ReportRecord, ReportScore, ReportType, RolePreset } from "@/lib/types";
import { bossTagLabels, scoreDimensionLabels } from "@/lib/role-presets";
import { marketPlaybooks } from "@/lib/market-playbooks";

type RoleDraft = {
  id?: string;
  name: string;
  title: string;
  responsibilities: string;
  projectContext: string;
  metrics: string;
  tone: string;
};

type FeedbackDraft = {
  rating: number;
  painPoint: string;
  usefulParts: string;
  missingParts: string;
  contact: string;
};

type ReportOutputFormat = "markdown" | "im" | "email";

type PreflightResult = {
  score: number;
  ready: boolean;
  summary: string;
  checks: Array<{
    id: string;
    label: string;
    severity: "ok" | "warn" | "missing";
    message: string;
    suggestion: string;
  }>;
};

type PlaybookRecommendation = {
  playbookId: string;
  playbookName: string;
  confidence: number;
  reasons: string[];
  signals: string[];
  alternatives: Array<{
    playbookId: string;
    playbookName: string;
    score: number;
  }>;
};

const reportTypes: Array<{ id: ReportType; label: string }> = [
  { id: "daily", label: "日报" },
  { id: "weekly", label: "周报" },
  { id: "monthly", label: "月报" }
];

const densityLabels = {
  low: "简洁",
  medium: "适中",
  high: "详细"
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function weekStart() {
  const date = new Date();
  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  return date.toISOString().slice(0, 10);
}

function monthStart() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

function initialRoleDraft(presetId = "product_manager"): RoleDraft {
  return {
    name: "我的汇报身份",
    title: "",
    responsibilities: "",
    projectContext: "",
    metrics: "",
    tone: "稳妥正式，先讲结果，再讲风险和下一步。"
  };
}

export default function HomePage() {
  const [rolePresets, setRolePresets] = useState<RolePreset[]>([]);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [bosses, setBosses] = useState<BossPersona[]>([]);
  const [history, setHistory] = useState<ReportRecord[]>([]);
  const [reportType, setReportType] = useState<ReportType>("daily");
  const [selectedPresetId, setSelectedPresetId] = useState("product_manager");
  const [selectedBossId, setSelectedBossId] = useState("");
  const [selectedPlaybookId, setSelectedPlaybookId] = useState("executive_brief");
  const [selectedProviderId, setSelectedProviderId] = useState("openai");
  const [model, setModel] = useState("");
  const [roleDraft, setRoleDraft] = useState<RoleDraft>(initialRoleDraft());
  const [bossDraft, setBossDraft] = useState<BossPersona | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [extraText, setExtraText] = useState("");
  const [periodStart, setPeriodStart] = useState(today());
  const [periodEnd, setPeriodEnd] = useState(today());
  const [historyFrom, setHistoryFrom] = useState(weekStart());
  const [historyTo, setHistoryTo] = useState(today());
  const [currentReport, setCurrentReport] = useState<ReportRecord | null>(null);
  const [activeOutput, setActiveOutput] = useState<"draft" | "optimized">("draft");
  const [outputFormat, setOutputFormat] = useState<ReportOutputFormat>("markdown");
  const [formattedOutput, setFormattedOutput] = useState("");
  const [formattingOutput, setFormattingOutput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [checkingInput, setCheckingInput] = useState(false);
  const [preflight, setPreflight] = useState<PreflightResult | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [testingProvider, setTestingProvider] = useState(false);
  const [recommendingPlaybook, setRecommendingPlaybook] = useState(false);
  const [playbookRecommendation, setPlaybookRecommendation] = useState<PlaybookRecommendation | null>(null);
  const [savingPersona, setSavingPersona] = useState(false);
  const [savingRole, setSavingRole] = useState(false);
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [feedbackDraft, setFeedbackDraft] = useState<FeedbackDraft>({
    rating: 4,
    painPoint: "",
    usefulParts: "",
    missingParts: "",
    contact: ""
  });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const selectedPreset = useMemo(
    () => rolePresets.find((preset) => preset.id === selectedPresetId) || rolePresets[0],
    [rolePresets, selectedPresetId]
  );

  const selectedProvider = useMemo(
    () => providers.find((provider) => provider.id === selectedProviderId) || providers[0],
    [providers, selectedProviderId]
  );

  const selectedPlaybook = useMemo(
    () => marketPlaybooks.find((playbook) => playbook.id === selectedPlaybookId) || marketPlaybooks[0],
    [selectedPlaybookId]
  );

  const latestScore = useMemo(() => currentReport?.scores.at(-1), [currentReport]);
  const outputContent = useMemo(
    () => (activeOutput === "optimized" ? currentReport?.optimizedContent : currentReport?.content),
    [activeOutput, currentReport]
  );

  useEffect(() => {
    void bootstrap();
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function formatOutput() {
      if (!outputContent) {
        setFormattedOutput("");
        return;
      }
      if (outputFormat === "markdown") {
        setFormattedOutput(outputContent);
        return;
      }
      setFormattingOutput(true);
      try {
        const response = await fetch("/api/reports/format", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: outputContent,
            format: outputFormat,
            reportType: currentReport?.type
          })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "格式化报告失败。");
        if (!cancelled) setFormattedOutput(data.content || outputContent);
      } catch {
        if (!cancelled) setFormattedOutput(outputContent);
      } finally {
        if (!cancelled) setFormattingOutput(false);
      }
    }
    void formatOutput();
    return () => {
      cancelled = true;
    };
  }, [currentReport?.type, outputContent, outputFormat]);

  useEffect(() => {
    if (selectedProvider) {
      setModel(selectedProvider.defaultModel);
    }
  }, [selectedProviderId, providers]);

  useEffect(() => {
    const current = bosses.find((boss) => boss.id === selectedBossId) || bosses[0];
    setBossDraft(current ? structuredClone(current) : null);
  }, [selectedBossId, bosses]);

  useEffect(() => {
    if (!selectedPreset) return;
    setFields((current) => {
      const next: Record<string, string> = {};
      for (const field of selectedPreset.fields) {
        next[field.id] = current[field.id] || "";
      }
      return next;
    });
    setRoleDraft((current) => ({
      ...current,
      name: current.name || `${selectedPreset.name}身份`,
      title: current.title || selectedPreset.name
    }));
  }, [selectedPresetId, selectedPreset]);

  useEffect(() => {
    if (reportType === "daily") {
      setPeriodStart(today());
      setPeriodEnd(today());
      return;
    }
    if (reportType === "weekly") {
      setPeriodStart(weekStart());
      setPeriodEnd(today());
      setHistoryFrom(weekStart());
      setHistoryTo(today());
      return;
    }
    setPeriodStart(monthStart());
    setPeriodEnd(today());
    setHistoryFrom(monthStart());
    setHistoryTo(today());
  }, [reportType]);

  useEffect(() => {
    setPlaybookRecommendation(null);
  }, [selectedPresetId, reportType]);

  async function bootstrap() {
    setError("");
    const [presetRes, providerRes, bossRes, historyRes] = await Promise.all([
      fetch("/api/presets/roles"),
      fetch("/api/providers"),
      fetch("/api/bosses"),
      fetch("/api/history?limit=20")
    ]);
    const [presetData, providerData, bossData, historyData] = await Promise.all([
      presetRes.json(),
      providerRes.json(),
      bossRes.json(),
      historyRes.json()
    ]);
    setRolePresets(presetData.roles || []);
    setProviders(providerData.providers || []);
    setBosses(bossData.bosses || []);
    setHistory(historyData.reports || []);
    setSelectedPresetId(presetData.roles?.[0]?.id || "product_manager");
    setSelectedProviderId(providerData.providers?.[0]?.id || "openai");
    setSelectedBossId(bossData.bosses?.[0]?.id || "");
  }

  async function refreshHistory() {
    const response = await fetch("/api/history?limit=20");
    const data = await response.json();
    setHistory(data.reports || []);
  }

  async function handleGenerate(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rolePresetId: selectedPresetId,
          roleProfile: {
            ...roleDraft,
            presetId: selectedPresetId
          },
          bossPersonaId: selectedBossId,
          provider: selectedProviderId,
          model,
          workInput: {
            reportType,
            playbookId: selectedPlaybookId,
            periodStart,
            periodEnd,
            fields: labeledFields(),
            extraText,
            historyFrom,
            historyTo
          }
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "生成失败。");
      setCurrentReport(data.report);
      setActiveOutput("draft");
      await refreshHistory();
      setNotice("已生成并完成评分。");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "生成失败。");
    } finally {
      setLoading(false);
    }
  }

  async function extractFieldsFromPaste() {
    setError("");
    setNotice("");
    if (!extraText.trim()) {
      setError("请先在补充粘贴中放入会议纪要、流水记录或项目材料。");
      return;
    }
    setExtracting(true);
    try {
      const response = await fetch("/api/inputs/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rolePresetId: selectedPresetId,
          text: extraText
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "拆解材料失败。");
      const extracted = data.fields || {};
      setFields((current) => {
        const next = { ...current };
        for (const [fieldId, result] of Object.entries(extracted)) {
          const value = typeof result === "object" && result ? String((result as { value?: unknown }).value || "") : "";
          if (value && !next[fieldId]?.trim()) {
            next[fieldId] = value;
          }
        }
        return next;
      });
      setNotice(data.summary || "已拆解粘贴材料。");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "拆解材料失败。");
    } finally {
      setExtracting(false);
    }
  }

  async function testCurrentProvider() {
    setError("");
    setNotice("");
    setTestingProvider(true);
    try {
      const response = await fetch("/api/providers/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: selectedProviderId,
          model
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "模型测试失败。");
      if (data.ok) {
        setNotice(`${data.providerName || "AI"} 连接成功，耗时 ${data.latencyMs}ms。`);
      } else if (data.configured === false) {
        setNotice(data.message || "当前模型尚未配置 API Key，可先使用本地体验稿。");
      } else {
        setError(data.message || "模型连接失败，请检查模型名、Key 或网络。");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "模型测试失败。");
    } finally {
      setTestingProvider(false);
    }
  }

  async function runInputPreflight() {
    setError("");
    setNotice("");
    setCheckingInput(true);
    try {
      const response = await fetch("/api/inputs/preflight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rolePresetId: selectedPresetId,
          workInput: {
            reportType,
            playbookId: selectedPlaybookId,
            periodStart,
            periodEnd,
            fields: labeledFields(),
            extraText,
            historyFrom,
            historyTo
          }
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "输入体检失败。");
      setPreflight(data);
      setNotice(data.summary || "输入体检完成。");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "输入体检失败。");
    } finally {
      setCheckingInput(false);
    }
  }

  async function recommendPlaybook() {
    setError("");
    setNotice("");
    setRecommendingPlaybook(true);
    try {
      const response = await fetch("/api/playbooks/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rolePresetId: selectedPresetId,
          reportType,
          workInput: {
            reportType,
            periodStart,
            periodEnd,
            fields: labeledFields(),
            extraText,
            historyFrom,
            historyTo
          }
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "推荐汇报打法失败。");
      setPlaybookRecommendation(data.recommendation);
      setNotice(`推荐使用“${data.recommendation.playbookName}”，置信度 ${data.recommendation.confidence}%。`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "推荐汇报打法失败。");
    } finally {
      setRecommendingPlaybook(false);
    }
  }

  function applyRecommendedPlaybook() {
    if (!playbookRecommendation) return;
    setSelectedPlaybookId(playbookRecommendation.playbookId);
    setNotice(`已应用推荐打法：${playbookRecommendation.playbookName}。`);
  }

  async function handleOptimize() {
    if (!currentReport) return;
    setOptimizing(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/reports/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: currentReport.id,
          provider: selectedProviderId,
          model
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "优化失败。");
      setCurrentReport(data.report);
      setActiveOutput("optimized");
      await refreshHistory();
      setNotice("已生成优化稿并重新评分。");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "优化失败。");
    } finally {
      setOptimizing(false);
    }
  }

  async function saveBossPersona() {
    if (!bossDraft) return;
    setSavingPersona(true);
    setError("");
    try {
      const response = await fetch(`/api/bosses/${bossDraft.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bossDraft)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "保存老板人设失败。");
      setBosses((current) => current.map((boss) => (boss.id === data.boss.id ? data.boss : boss)));
      setNotice("老板人设已保存。");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "保存失败。");
    } finally {
      setSavingPersona(false);
    }
  }

  async function saveRoleProfile() {
    setSavingRole(true);
    setError("");
    try {
      const response = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...roleDraft,
          presetId: selectedPresetId,
          name: roleDraft.name || roleDraft.title || `${selectedPreset?.name || "岗位"}身份`
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "保存身份失败。");
      setRoleDraft({ ...roleDraft, id: data.role.id, name: data.role.name });
      setNotice("身份快照已保存。");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "保存身份失败。");
    } finally {
      setSavingRole(false);
    }
  }

  async function copyOutput() {
    const content = formattedOutput || outputContent;
    if (!content) return;
    await navigator.clipboard.writeText(content);
    setNotice("已复制到剪贴板。");
  }

  async function exportData() {
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/export");
      if (!response.ok) throw new Error("导出失败。");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `work-summary-export-${today()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setNotice("本地数据已导出。");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "导出失败。");
    }
  }

  async function resetData() {
    const confirmed = window.confirm("这会清空本机保存的身份、老板人设、报告和评分，并恢复默认老板人设。确定继续吗？");
    if (!confirmed) return;
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/settings/reset", { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "清空失败。");
      setBosses(data.bossPersonas || []);
      setSelectedBossId(data.bossPersonas?.[0]?.id || "");
      setHistory([]);
      setCurrentReport(null);
      setNotice("本地数据已清空，并恢复默认老板人设。");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "清空失败。");
    }
  }

  async function submitFeedback() {
    setError("");
    setNotice("");
    if (!feedbackDraft.painPoint && !feedbackDraft.usefulParts && !feedbackDraft.missingParts) {
      setError("请至少填写一个试用反馈点。");
      return;
    }
    setSendingFeedback(true);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: feedbackDraft.rating,
          rolePresetId: selectedPresetId,
          reportType,
          painPoint: feedbackDraft.painPoint,
          usefulParts: feedbackDraft.usefulParts,
          missingParts: feedbackDraft.missingParts,
          contact: feedbackDraft.contact
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "保存反馈失败。");
      setFeedbackDraft({
        rating: 4,
        painPoint: "",
        usefulParts: "",
        missingParts: "",
        contact: ""
      });
      setNotice("试用反馈已保存。");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "保存反馈失败。");
    } finally {
      setSendingFeedback(false);
    }
  }

  function labeledFields(): Record<string, string> {
    if (!selectedPreset) return fields;
    return Object.fromEntries(selectedPreset.fields.map((field) => [field.label, fields[field.id] || ""]));
  }

  function updateBossTag(tag: BossTagId, value: number) {
    setBossDraft((current) =>
      current
        ? {
            ...current,
            tags: { ...current.tags, [tag]: value }
          }
        : current
    );
  }

  return (
    <main className="app-shell">
      <section className="topbar">
        <div>
          <div className="brand-row">
            <Bot size={24} aria-hidden />
            <h1>多岗位 AI 工作汇报生成器</h1>
          </div>
          <p>把真实工作材料整理成领导能快速判断价值和风险的日报、周报、月报。</p>
        </div>
        <div className="provider-strip">
          <label>
            <span>AI</span>
            <select value={selectedProviderId} onChange={(event) => setSelectedProviderId(event.target.value)}>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}{provider.configured ? "" : "（未配置）"}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>模型</span>
            <input value={model} onChange={(event) => setModel(event.target.value)} list="model-options" />
          </label>
          <button type="button" className="provider-test-button" onClick={testCurrentProvider} disabled={testingProvider || !selectedProvider}>
            <PlugZap size={16} aria-hidden />
            {testingProvider ? "测试中" : "测试模型"}
          </button>
          <datalist id="model-options">
            {selectedProvider?.models.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
          <div className={selectedProvider?.configured ? "provider-status ready" : "provider-status warn"}>
            <ShieldCheck size={16} aria-hidden />
            <span>
              {selectedProvider?.configured
                ? "AI Key 已配置"
                : selectedProvider
                  ? `未配置 ${selectedProvider.apiKeyEnv}，可先生成本地体验稿`
                  : "正在读取 AI 配置"}
            </span>
          </div>
        </div>
      </section>

      {(error || notice) && (
        <div className={error ? "toast error" : "toast success"}>
          {error ? <AlertCircle size={18} aria-hidden /> : <Check size={18} aria-hidden />}
          <span>{error || notice}</span>
        </div>
      )}

      <form className="workspace-grid" onSubmit={handleGenerate}>
        <section className="panel controls-panel">
          <div className="panel-title">
            <CalendarDays size={18} aria-hidden />
            <h2>周期</h2>
          </div>
          <div className="segmented">
            {reportTypes.map((type) => (
              <button
                type="button"
                className={reportType === type.id ? "active" : ""}
                key={type.id}
                onClick={() => setReportType(type.id)}
              >
                {type.label}
              </button>
            ))}
          </div>
          <div className="two-col">
            <label>
              <span>开始</span>
              <input type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} />
            </label>
            <label>
              <span>结束</span>
              <input type="date" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} />
            </label>
          </div>
          {reportType !== "daily" && (
            <div className="history-range">
              <div className="inline-label">
                <Database size={16} aria-hidden />
                <span>历史聚合范围</span>
              </div>
              <div className="two-col">
                <input type="date" value={historyFrom} onChange={(event) => setHistoryFrom(event.target.value)} />
                <input type="date" value={historyTo} onChange={(event) => setHistoryTo(event.target.value)} />
              </div>
            </div>
          )}
        </section>

        <section className="panel role-panel">
          <div className="panel-title">
            <BriefcaseBusiness size={18} aria-hidden />
            <h2>岗位</h2>
          </div>
          <div className="role-tabs">
            {rolePresets.map((preset) => (
              <button
                type="button"
                key={preset.id}
                className={selectedPresetId === preset.id ? "active" : ""}
                onClick={() => setSelectedPresetId(preset.id)}
              >
                <span>{preset.shortName}</span>
              </button>
            ))}
          </div>
          {selectedPreset && (
            <div className="preset-summary">
              <strong>{selectedPreset.name}</strong>
              <p>{selectedPreset.summary}</p>
            </div>
          )}
          <div className="stacked-fields">
            <label>
              <span>身份名称</span>
              <input value={roleDraft.name} onChange={(event) => setRoleDraft({ ...roleDraft, name: event.target.value })} />
            </label>
            <label>
              <span>职位</span>
              <input value={roleDraft.title} onChange={(event) => setRoleDraft({ ...roleDraft, title: event.target.value })} />
            </label>
            <label>
              <span>职责</span>
              <textarea value={roleDraft.responsibilities} onChange={(event) => setRoleDraft({ ...roleDraft, responsibilities: event.target.value })} />
            </label>
            <label>
              <span>项目背景</span>
              <textarea value={roleDraft.projectContext} onChange={(event) => setRoleDraft({ ...roleDraft, projectContext: event.target.value })} />
            </label>
            <label>
              <span>常用指标</span>
              <textarea value={roleDraft.metrics} onChange={(event) => setRoleDraft({ ...roleDraft, metrics: event.target.value })} />
            </label>
            <label>
              <span>口吻</span>
              <input value={roleDraft.tone} onChange={(event) => setRoleDraft({ ...roleDraft, tone: event.target.value })} />
            </label>
          </div>
          <button type="button" className="secondary-action" onClick={saveRoleProfile} disabled={savingRole}>
            <Save size={16} aria-hidden />
            {savingRole ? "保存中" : "保存身份"}
          </button>
        </section>

        <section className="panel boss-panel">
          <div className="panel-title">
            <UserRoundCog size={18} aria-hidden />
            <h2>老板人设</h2>
          </div>
          <select value={selectedBossId} onChange={(event) => setSelectedBossId(event.target.value)}>
            {bosses.map((boss) => (
              <option key={boss.id} value={boss.id}>
                {boss.name}
              </option>
            ))}
          </select>
          {bossDraft && (
            <>
              <div className="stacked-fields compact">
                <label>
                  <span>名称</span>
                  <input value={bossDraft.name} onChange={(event) => setBossDraft({ ...bossDraft, name: event.target.value })} />
                </label>
                <label>
                  <span>描述</span>
                  <textarea value={bossDraft.description} onChange={(event) => setBossDraft({ ...bossDraft, description: event.target.value })} />
                </label>
                <label>
                  <span>语气</span>
                  <input value={bossDraft.tone} onChange={(event) => setBossDraft({ ...bossDraft, tone: event.target.value })} />
                </label>
                <label>
                  <span>信息密度</span>
                  <select
                    value={bossDraft.density}
                    onChange={(event) => setBossDraft({ ...bossDraft, density: event.target.value as BossPersona["density"] })}
                  >
                    {Object.entries(densityLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="tag-grid">
                {(Object.keys(bossTagLabels) as BossTagId[]).map((tag) => (
                  <label key={tag} className="slider-row">
                    <span>{bossTagLabels[tag]}</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={bossDraft.tags[tag]}
                      onChange={(event) => updateBossTag(tag, Number(event.target.value))}
                    />
                    <b>{bossDraft.tags[tag]}</b>
                  </label>
                ))}
              </div>
              <label className="avoidance-field">
                <span>禁忌</span>
                <textarea value={bossDraft.avoidances} onChange={(event) => setBossDraft({ ...bossDraft, avoidances: event.target.value })} />
              </label>
              <button type="button" className="secondary-action" onClick={saveBossPersona} disabled={savingPersona}>
                <Settings2 size={16} aria-hidden />
                {savingPersona ? "保存中" : "保存人设"}
              </button>
            </>
          )}
        </section>

        <section className="panel playbook-panel">
          <div className="panel-title">
            <Compass size={18} aria-hidden />
            <h2>汇报打法</h2>
          </div>
          <div className="playbook-options">
            {marketPlaybooks.map((playbook) => (
              <button
                type="button"
                key={playbook.id}
                className={selectedPlaybookId === playbook.id ? "active" : ""}
                onClick={() => setSelectedPlaybookId(playbook.id)}
              >
                <span>{playbook.shortName}</span>
              </button>
            ))}
          </div>
          <div className="playbook-summary">
            <strong>{selectedPlaybook.name}</strong>
            <p>{selectedPlaybook.summary}</p>
            <div className="signal-list">
              {selectedPlaybook.marketSignals.map((signal) => (
                <span key={signal}>{signal}</span>
              ))}
            </div>
          </div>
          <div className="playbook-actions">
            <button type="button" className="secondary-action" onClick={recommendPlaybook} disabled={recommendingPlaybook}>
              <Sparkles size={16} aria-hidden />
              {recommendingPlaybook ? "推荐中" : "智能推荐"}
            </button>
            {playbookRecommendation && playbookRecommendation.playbookId !== selectedPlaybookId ? (
              <button type="button" className="secondary-action" onClick={applyRecommendedPlaybook}>
                <Check size={16} aria-hidden />
                应用推荐
              </button>
            ) : null}
          </div>
          {playbookRecommendation ? (
            <div className="recommendation-box">
              <div className="recommendation-head">
                <strong>{playbookRecommendation.playbookName}</strong>
                <span>{playbookRecommendation.confidence}%</span>
              </div>
              <ul>
                {playbookRecommendation.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
              {playbookRecommendation.alternatives.length ? (
                <small>
                  备选：{playbookRecommendation.alternatives.map((item) => item.playbookName).join("、")}
                </small>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="panel input-panel">
          <div className="panel-title">
            <Clipboard size={18} aria-hidden />
            <h2>工作内容</h2>
          </div>
          <div className="input-grid">
            {selectedPreset?.fields.map((field) => (
              <label key={field.id} className={field.kind === "short" ? "" : "wide"}>
                <span>
                  {field.label}
                  {field.required ? <em>必填</em> : null}
                </span>
                <textarea
                  value={fields[field.id] || ""}
                  placeholder={field.placeholder}
                  onChange={(event) => setFields({ ...fields, [field.id]: event.target.value })}
                  rows={field.kind === "metrics" ? 4 : 5}
                />
              </label>
            ))}
          </div>
          <label className="extra-field">
            <span className="field-title-row">
              补充粘贴
              <button type="button" className="inline-tool" onClick={extractFieldsFromPaste} disabled={extracting || !extraText.trim()}>
                <WandSparkles size={15} aria-hidden />
                {extracting ? "拆解中" : "拆解粘贴"}
              </button>
            </span>
            <textarea
              value={extraText}
              placeholder="会议纪要、项目进展、客户反馈、代码提交、缺陷记录等都可以粘贴在这里。"
              onChange={(event) => setExtraText(event.target.value)}
              rows={8}
            />
          </label>
          <button type="submit" className="primary-action" disabled={loading}>
            <Sparkles size={18} aria-hidden />
            {loading ? "生成中" : "生成并评分"}
            <ChevronRight size={18} aria-hidden />
          </button>
          <button type="button" className="secondary-action" onClick={runInputPreflight} disabled={checkingInput}>
            <ListChecks size={16} aria-hidden />
            {checkingInput ? "体检中" : "输入体检"}
          </button>
          {preflight ? (
            <div className="preflight-box">
              <div className="preflight-head">
                <strong>{preflight.score}</strong>
                <span>{preflight.summary}</span>
              </div>
              <div className="preflight-list">
                {preflight.checks.map((check) => (
                  <div className={`preflight-item ${check.severity}`} key={check.id}>
                    <b>{check.label}</b>
                    <p>{check.message}</p>
                    <small>{check.suggestion}</small>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section className="panel output-panel">
          <div className="panel-title split">
            <span>
              <Sparkles size={18} aria-hidden />
              <h2>报告</h2>
            </span>
            <div className="icon-actions">
              <button type="button" aria-label="复制报告" title="复制报告" onClick={copyOutput} disabled={!outputContent}>
                <Copy size={17} aria-hidden />
              </button>
              <button type="button" aria-label="刷新历史" title="刷新历史" onClick={refreshHistory}>
                <RefreshCcw size={17} aria-hidden />
              </button>
            </div>
          </div>
          <div className="segmented output-tabs">
            <button type="button" className={activeOutput === "draft" ? "active" : ""} onClick={() => setActiveOutput("draft")}>
              初稿
            </button>
            <button
              type="button"
              className={activeOutput === "optimized" ? "active" : ""}
              onClick={() => setActiveOutput("optimized")}
              disabled={!currentReport?.optimizedContent}
            >
              优化稿
            </button>
          </div>
          <div className="format-row">
            <label>
              <span>复制格式</span>
              <select value={outputFormat} onChange={(event) => setOutputFormat(event.target.value as ReportOutputFormat)}>
                <option value="markdown">Markdown</option>
                <option value="im">IM 简洁版</option>
                <option value="email">邮件版</option>
              </select>
            </label>
            {formattingOutput ? <small>格式化中</small> : null}
          </div>
          <article className="report-preview">
            {outputContent ? <pre>{formattedOutput || outputContent}</pre> : <EmptyState />}
          </article>
          <div className="output-actions">
            <button type="button" className="secondary-action" onClick={handleOptimize} disabled={!currentReport || optimizing}>
              <Gauge size={16} aria-hidden />
              {optimizing ? "优化中" : "按评分优化"}
            </button>
          </div>
        </section>

        <section className="panel score-panel">
          <div className="panel-title">
            <Gauge size={18} aria-hidden />
            <h2>评分</h2>
          </div>
          {latestScore ? <ScoreView score={latestScore} /> : <EmptyScore />}
        </section>

        <section className="panel history-panel">
          <div className="panel-title split">
            <span>
              <Database size={18} aria-hidden />
              <h2>历史</h2>
            </span>
            <div className="icon-actions">
              <button type="button" aria-label="导出本地数据" title="导出本地数据" onClick={exportData}>
                <Download size={17} aria-hidden />
              </button>
              <button type="button" aria-label="清空本地数据" title="清空本地数据" onClick={resetData}>
                <Trash2 size={17} aria-hidden />
              </button>
            </div>
          </div>
          <div className="history-list">
            {history.length ? (
              history.map((report) => (
                <button type="button" key={report.id} onClick={() => { setCurrentReport(report); setActiveOutput(report.optimizedContent ? "optimized" : "draft"); }}>
                  <span>{report.type === "daily" ? "日报" : report.type === "weekly" ? "周报" : "月报"}</span>
                  <strong>{report.periodStart} 至 {report.periodEnd}</strong>
                  <small>{report.roleProfile?.title || report.rolePresetId}</small>
                </button>
              ))
            ) : (
              <p className="muted">暂无历史报告</p>
            )}
          </div>
        </section>

        <section className="panel feedback-panel">
          <div className="panel-title">
            <MessageSquareText size={18} aria-hidden />
            <h2>试用反馈</h2>
          </div>
          <p className="muted">告诉我们这次生成是否解决了你的汇报痛点，反馈会保存在本机并随数据导出。</p>
          <label>
            <span>整体评分</span>
            <select
              value={feedbackDraft.rating}
              onChange={(event) => setFeedbackDraft({ ...feedbackDraft, rating: Number(event.target.value) })}
            >
              <option value={5}>5 - 很适合直接使用</option>
              <option value={4}>4 - 基本可用</option>
              <option value={3}>3 - 需要明显修改</option>
              <option value={2}>2 - 不太符合场景</option>
              <option value={1}>1 - 没有解决问题</option>
            </select>
          </label>
          <label>
            <span>原本最痛的点</span>
            <textarea
              value={feedbackDraft.painPoint}
              placeholder="例如：周报总是像流水账，领导看不到结果和风险。"
              onChange={(event) => setFeedbackDraft({ ...feedbackDraft, painPoint: event.target.value })}
              rows={3}
            />
          </label>
          <label>
            <span>有用的部分</span>
            <textarea
              value={feedbackDraft.usefulParts}
              placeholder="例如：风险和下一步写得更清楚，销售金额/回款字段有帮助。"
              onChange={(event) => setFeedbackDraft({ ...feedbackDraft, usefulParts: event.target.value })}
              rows={3}
            />
          </label>
          <label>
            <span>还缺什么</span>
            <textarea
              value={feedbackDraft.missingParts}
              placeholder="例如：希望支持从飞书/Jira/CRM 自动导入，或者增加邮件格式。"
              onChange={(event) => setFeedbackDraft({ ...feedbackDraft, missingParts: event.target.value })}
              rows={3}
            />
          </label>
          <label>
            <span>联系方式（可选）</span>
            <input
              value={feedbackDraft.contact}
              placeholder="用于后续访谈，可留空"
              onChange={(event) => setFeedbackDraft({ ...feedbackDraft, contact: event.target.value })}
            />
          </label>
          <button type="button" className="secondary-action" onClick={submitFeedback} disabled={sendingFeedback}>
            <Send size={16} aria-hidden />
            {sendingFeedback ? "保存中" : "提交反馈"}
          </button>
        </section>
      </form>
    </main>
  );
}

function EmptyState() {
  return (
    <div className="empty-state">
      <Sparkles size={28} aria-hidden />
      <p>生成后的 Markdown 报告会显示在这里。</p>
    </div>
  );
}

function EmptyScore() {
  return (
    <div className="empty-state small">
      <Gauge size={24} aria-hidden />
      <p>评分会随报告一起生成。</p>
    </div>
  );
}

function ScoreView({ score }: { score: ReportScore }) {
  return (
    <div className="score-view">
      <div className="score-total">
        <strong>{score.total}</strong>
        <span>总分</span>
      </div>
      <p>{score.summary}</p>
      <div className="dimension-list">
        {score.dimensions.map((dimension) => (
          <div className="dimension" key={dimension.id}>
            <div>
              <strong>{dimension.name || scoreDimensionLabels[dimension.id]}</strong>
              <b>{dimension.score}</b>
            </div>
            <meter min="0" max="100" value={dimension.score} />
            <p>{dimension.reason}</p>
            <small>{dimension.suggestion}</small>
          </div>
        ))}
      </div>
      {score.suggestions.length ? (
        <div className="suggestions">
          {score.suggestions.map((item, index) => (
            <span key={`${item}-${index}`}>{item}</span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
