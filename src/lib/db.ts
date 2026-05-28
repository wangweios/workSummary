import fs from "node:fs";
import path from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { bossTagLabels } from "@/lib/role-presets";
import type { BossPersona, ReportRecord, ReportScore, RoleProfile } from "@/lib/types";
import { createId, nowIso, parseJson } from "@/lib/utils";

type Row = Record<string, unknown>;

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "work-summary.sqlite");

declare global {
  // eslint-disable-next-line no-var
  var __workSummaryDb: DatabaseSync | undefined;
}

function json(value: unknown): string {
  return JSON.stringify(value ?? null);
}

function rowString(row: Row, key: string): string {
  const value = row[key];
  return typeof value === "string" ? value : "";
}

function rowNumber(row: Row, key: string): number {
  const value = row[key];
  return typeof value === "number" ? value : Number(value ?? 0);
}

function getDb(): DatabaseSync {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!globalThis.__workSummaryDb) {
    const { DatabaseSync } = require("node:sqlite") as {
      DatabaseSync: new (location: string) => DatabaseSync;
    };
    globalThis.__workSummaryDb = new DatabaseSync(dbPath);
    initializeDb(globalThis.__workSummaryDb);
  }
  return globalThis.__workSummaryDb;
}

function initializeDb(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS role_profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      preset_id TEXT NOT NULL,
      title TEXT NOT NULL,
      responsibilities TEXT NOT NULL,
      project_context TEXT NOT NULL,
      metrics TEXT NOT NULL,
      tone TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS boss_personas (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      tags_json TEXT NOT NULL,
      avoidances TEXT NOT NULL,
      tone TEXT NOT NULL,
      density TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      period_start TEXT NOT NULL,
      period_end TEXT NOT NULL,
      role_preset_id TEXT NOT NULL,
      role_profile_id TEXT,
      boss_persona_id TEXT,
      provider TEXT NOT NULL,
      model TEXT NOT NULL,
      input_json TEXT NOT NULL,
      role_profile_snapshot TEXT NOT NULL,
      boss_persona_snapshot TEXT NOT NULL,
      content TEXT NOT NULL,
      optimized_content TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS report_scores (
      id TEXT PRIMARY KEY,
      report_id TEXT NOT NULL,
      target TEXT NOT NULL,
      total INTEGER NOT NULL,
      dimensions_json TEXT NOT NULL,
      suggestions_json TEXT NOT NULL,
      summary TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(report_id) REFERENCES reports(id) ON DELETE CASCADE
    );
  `);

  seedBossPersonas(db);
}

function seedBossPersonas(db: DatabaseSync) {
  const count = (db.prepare("SELECT COUNT(*) AS count FROM boss_personas").get() as Row | undefined)?.count;
  if (Number(count ?? 0) > 0) return;

  const baseTags = Object.keys(bossTagLabels).reduce(
    (acc, key) => ({ ...acc, [key]: 50 }),
    {} as BossPersona["tags"]
  );

  const personas: Array<Omit<BossPersona, "id" | "createdAt" | "updatedAt">> = [
    {
      name: "结果导向型老板",
      description: "关注产出、业务影响和下一步动作，偏好短句和明确结论。",
      tags: { ...baseTags, result: 90, data: 70, concise: 80, risk: 55 },
      avoidances: "避免流水账、过程过多、没有结果的铺垫。",
      tone: "稳妥正式，先结论后细节。",
      density: "medium"
    },
    {
      name: "风险敏感型老板",
      description: "关注阻塞、风险、预案和需要协调的资源。",
      tags: { ...baseTags, risk: 90, process: 70, collaboration: 72, result: 70 },
      avoidances: "避免只报喜不报忧，风险不能含糊。",
      tone: "客观克制，风险和预案写清楚。",
      density: "high"
    },
    {
      name: "数据敏感型老板",
      description: "喜欢用数字判断进展质量，关注趋势、缺口和影响范围。",
      tags: { ...baseTags, data: 92, result: 82, cost: 68, concise: 66 },
      avoidances: "避免空泛形容词，没有数据时必须说明暂无量化数据。",
      tone: "用数据说话，表达简洁。",
      density: "medium"
    }
  ];

  for (const persona of personas) {
    createBossPersona(persona, db);
  }
}

export function listRoleProfiles(): RoleProfile[] {
  const rows = getDb().prepare("SELECT * FROM role_profiles ORDER BY updated_at DESC").all() as Row[];
  return rows.map(mapRoleProfile);
}

export function getRoleProfile(id: string): RoleProfile | null {
  const row = getDb().prepare("SELECT * FROM role_profiles WHERE id = ?").get(id) as Row | undefined;
  return row ? mapRoleProfile(row) : null;
}

export function createRoleProfile(input: Partial<RoleProfile>): RoleProfile {
  const db = getDb();
  const createdAt = nowIso();
  const profile: RoleProfile = {
    id: createId("role"),
    name: String(input.name || input.title || "我的身份"),
    presetId: String(input.presetId || "product_manager"),
    title: String(input.title || ""),
    responsibilities: String(input.responsibilities || ""),
    projectContext: String(input.projectContext || ""),
    metrics: String(input.metrics || ""),
    tone: String(input.tone || "稳妥正式，突出结果和风险。"),
    createdAt,
    updatedAt: createdAt
  };

  db.prepare(`
    INSERT INTO role_profiles
      (id, name, preset_id, title, responsibilities, project_context, metrics, tone, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    profile.id,
    profile.name,
    profile.presetId,
    profile.title,
    profile.responsibilities,
    profile.projectContext,
    profile.metrics,
    profile.tone,
    profile.createdAt,
    profile.updatedAt
  );

  return profile;
}

export function updateRoleProfile(id: string, input: Partial<RoleProfile>): RoleProfile | null {
  const current = getRoleProfile(id);
  if (!current) return null;
  const updated: RoleProfile = {
    ...current,
    ...input,
    id,
    updatedAt: nowIso()
  };
  getDb().prepare(`
    UPDATE role_profiles
    SET name = ?, preset_id = ?, title = ?, responsibilities = ?, project_context = ?, metrics = ?, tone = ?, updated_at = ?
    WHERE id = ?
  `).run(
    updated.name,
    updated.presetId,
    updated.title,
    updated.responsibilities,
    updated.projectContext,
    updated.metrics,
    updated.tone,
    updated.updatedAt,
    id
  );
  return updated;
}

export function deleteRoleProfile(id: string): boolean {
  const result = getDb().prepare("DELETE FROM role_profiles WHERE id = ?").run(id);
  return result.changes > 0;
}

export function listBossPersonas(): BossPersona[] {
  const rows = getDb().prepare("SELECT * FROM boss_personas ORDER BY updated_at DESC").all() as Row[];
  return rows.map(mapBossPersona);
}

export function getBossPersona(id: string): BossPersona | null {
  const row = getDb().prepare("SELECT * FROM boss_personas WHERE id = ?").get(id) as Row | undefined;
  return row ? mapBossPersona(row) : null;
}

export function createBossPersona(input: Partial<BossPersona>, db = getDb()): BossPersona {
  const createdAt = nowIso();
  const persona: BossPersona = {
    id: createId("boss"),
    name: String(input.name || "新老板人设"),
    description: String(input.description || ""),
    tags: normalizeTags(input.tags),
    avoidances: String(input.avoidances || ""),
    tone: String(input.tone || "稳妥正式，适合向上汇报。"),
    density: input.density === "low" || input.density === "high" ? input.density : "medium",
    createdAt,
    updatedAt: createdAt
  };

  db.prepare(`
    INSERT INTO boss_personas
      (id, name, description, tags_json, avoidances, tone, density, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    persona.id,
    persona.name,
    persona.description,
    json(persona.tags),
    persona.avoidances,
    persona.tone,
    persona.density,
    persona.createdAt,
    persona.updatedAt
  );

  return persona;
}

export function updateBossPersona(id: string, input: Partial<BossPersona>): BossPersona | null {
  const current = getBossPersona(id);
  if (!current) return null;
  const updated: BossPersona = {
    ...current,
    ...input,
    id,
    tags: normalizeTags(input.tags ?? current.tags),
    updatedAt: nowIso()
  };

  getDb().prepare(`
    UPDATE boss_personas
    SET name = ?, description = ?, tags_json = ?, avoidances = ?, tone = ?, density = ?, updated_at = ?
    WHERE id = ?
  `).run(
    updated.name,
    updated.description,
    json(updated.tags),
    updated.avoidances,
    updated.tone,
    updated.density,
    updated.updatedAt,
    id
  );

  return updated;
}

export function deleteBossPersona(id: string): boolean {
  const result = getDb().prepare("DELETE FROM boss_personas WHERE id = ?").run(id);
  return result.changes > 0;
}

export function createReport(input: {
  type: ReportRecord["type"];
  periodStart: string;
  periodEnd: string;
  rolePresetId: string;
  roleProfileId?: string;
  bossPersonaId?: string;
  provider: string;
  model: string;
  workInput: ReportRecord["input"];
  roleProfile: Partial<RoleProfile>;
  bossPersona: BossPersona;
  content: string;
}): ReportRecord {
  const createdAt = nowIso();
  const report: ReportRecord = {
    id: createId("report"),
    type: input.type,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    rolePresetId: input.rolePresetId,
    roleProfileId: input.roleProfileId,
    bossPersonaId: input.bossPersonaId,
    provider: input.provider,
    model: input.model,
    input: input.workInput,
    roleProfile: input.roleProfile,
    bossPersona: input.bossPersona,
    content: input.content,
    scores: [],
    createdAt,
    updatedAt: createdAt
  };

  getDb().prepare(`
    INSERT INTO reports
      (id, type, period_start, period_end, role_preset_id, role_profile_id, boss_persona_id, provider, model,
       input_json, role_profile_snapshot, boss_persona_snapshot, content, optimized_content, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    report.id,
    report.type,
    report.periodStart,
    report.periodEnd,
    report.rolePresetId,
    report.roleProfileId ?? null,
    report.bossPersonaId ?? null,
    report.provider,
    report.model,
    json(report.input),
    json(report.roleProfile),
    json(report.bossPersona),
    report.content,
    report.optimizedContent ?? null,
    report.createdAt,
    report.updatedAt
  );

  return report;
}

export function updateReportOptimizedContent(reportId: string, optimizedContent: string): ReportRecord | null {
  const updatedAt = nowIso();
  const result = getDb()
    .prepare("UPDATE reports SET optimized_content = ?, updated_at = ? WHERE id = ?")
    .run(optimizedContent, updatedAt, reportId);
  return result.changes > 0 ? getReport(reportId) : null;
}

export function addReportScore(input: Omit<ReportScore, "id" | "createdAt">): ReportScore {
  const score: ReportScore = {
    ...input,
    id: createId("score"),
    createdAt: nowIso()
  };

  getDb().prepare(`
    INSERT INTO report_scores
      (id, report_id, target, total, dimensions_json, suggestions_json, summary, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    score.id,
    score.reportId,
    score.target,
    score.total,
    json(score.dimensions),
    json(score.suggestions),
    score.summary,
    score.createdAt
  );

  return score;
}

export function getReport(id: string): ReportRecord | null {
  const row = getDb().prepare("SELECT * FROM reports WHERE id = ?").get(id) as Row | undefined;
  if (!row) return null;
  return mapReport(row, listScoresForReport(id));
}

export function listReports(options: { limit?: number; type?: string; from?: string; to?: string } = {}): ReportRecord[] {
  const limit = Math.min(Math.max(Number(options.limit ?? 30), 1), 100);
  const where: string[] = [];
  const params: unknown[] = [];

  if (options.type) {
    where.push("type = ?");
    params.push(options.type);
  }
  if (options.from) {
    where.push("period_end >= ?");
    params.push(options.from);
  }
  if (options.to) {
    where.push("period_start <= ?");
    params.push(options.to);
  }

  const rows = getDb()
    .prepare(`
      SELECT * FROM reports
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `)
    .all(...params) as Row[];

  return rows.map((row) => mapReport(row, listScoresForReport(rowString(row, "id"))));
}

export function listReportsForAggregation(options: { from?: string; to?: string; excludeType?: string }): ReportRecord[] {
  const where = ["1 = 1"];
  const params: unknown[] = [];
  if (options.from) {
    where.push("period_end >= ?");
    params.push(options.from);
  }
  if (options.to) {
    where.push("period_start <= ?");
    params.push(options.to);
  }
  if (options.excludeType) {
    where.push("type != ?");
    params.push(options.excludeType);
  }

  const rows = getDb()
    .prepare(`
      SELECT * FROM reports
      WHERE ${where.join(" AND ")}
      ORDER BY period_start ASC, created_at ASC
      LIMIT 60
    `)
    .all(...params) as Row[];

  return rows.map((row) => mapReport(row, listScoresForReport(rowString(row, "id"))));
}

function listScoresForReport(reportId: string): ReportScore[] {
  const rows = getDb()
    .prepare("SELECT * FROM report_scores WHERE report_id = ? ORDER BY created_at ASC")
    .all(reportId) as Row[];
  return rows.map(mapScore);
}

function mapRoleProfile(row: Row): RoleProfile {
  return {
    id: rowString(row, "id"),
    name: rowString(row, "name"),
    presetId: rowString(row, "preset_id"),
    title: rowString(row, "title"),
    responsibilities: rowString(row, "responsibilities"),
    projectContext: rowString(row, "project_context"),
    metrics: rowString(row, "metrics"),
    tone: rowString(row, "tone"),
    createdAt: rowString(row, "created_at"),
    updatedAt: rowString(row, "updated_at")
  };
}

function mapBossPersona(row: Row): BossPersona {
  return {
    id: rowString(row, "id"),
    name: rowString(row, "name"),
    description: rowString(row, "description"),
    tags: normalizeTags(parseJson(rowString(row, "tags_json"), {})),
    avoidances: rowString(row, "avoidances"),
    tone: rowString(row, "tone"),
    density: rowString(row, "density") === "low" || rowString(row, "density") === "high" ? (rowString(row, "density") as "low" | "high") : "medium",
    createdAt: rowString(row, "created_at"),
    updatedAt: rowString(row, "updated_at")
  };
}

function mapReport(row: Row, scores: ReportScore[]): ReportRecord {
  return {
    id: rowString(row, "id"),
    type: rowString(row, "type") as ReportRecord["type"],
    periodStart: rowString(row, "period_start"),
    periodEnd: rowString(row, "period_end"),
    rolePresetId: rowString(row, "role_preset_id"),
    roleProfileId: rowString(row, "role_profile_id") || undefined,
    bossPersonaId: rowString(row, "boss_persona_id") || undefined,
    provider: rowString(row, "provider"),
    model: rowString(row, "model"),
    input: parseJson(rowString(row, "input_json"), {
      reportType: "daily",
      periodStart: "",
      periodEnd: "",
      fields: {},
      extraText: ""
    }),
    roleProfile: parseJson(rowString(row, "role_profile_snapshot"), {}),
    bossPersona: parseJson(rowString(row, "boss_persona_snapshot"), getDefaultPersona()),
    content: rowString(row, "content"),
    optimizedContent: rowString(row, "optimized_content") || undefined,
    scores,
    createdAt: rowString(row, "created_at"),
    updatedAt: rowString(row, "updated_at")
  };
}

function mapScore(row: Row): ReportScore {
  return {
    id: rowString(row, "id"),
    reportId: rowString(row, "report_id"),
    target: rowString(row, "target") === "optimized" ? "optimized" : "draft",
    total: rowNumber(row, "total"),
    dimensions: parseJson(rowString(row, "dimensions_json"), []),
    suggestions: parseJson(rowString(row, "suggestions_json"), []),
    summary: rowString(row, "summary"),
    createdAt: rowString(row, "created_at")
  };
}

function normalizeTags(tags: unknown): BossPersona["tags"] {
  const raw = typeof tags === "object" && tags ? (tags as Partial<Record<keyof typeof bossTagLabels, unknown>>) : {};
  return (Object.keys(bossTagLabels) as Array<keyof typeof bossTagLabels>).reduce((acc, key) => {
    const value = Number(raw[key] ?? 50);
    acc[key] = Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : 50;
    return acc;
  }, {} as BossPersona["tags"]);
}

function getDefaultPersona(): BossPersona {
  const now = nowIso();
  return {
    id: "default",
    name: "默认老板",
    description: "",
    tags: normalizeTags({}),
    avoidances: "",
    tone: "稳妥正式",
    density: "medium",
    createdAt: now,
    updatedAt: now
  };
}
