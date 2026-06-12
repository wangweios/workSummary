export type ReportType = "daily" | "weekly" | "monthly";

export type ReportHealth = "unknown" | "on_track" | "attention" | "at_risk" | "blocked";

export type ScoreDimensionId =
  | "boss_fit"
  | "impact"
  | "data"
  | "clarity"
  | "risk"
  | "next_steps"
  | "factfulness";

export type BossTagId =
  | "result"
  | "data"
  | "risk"
  | "concise"
  | "process"
  | "customer"
  | "cost"
  | "collaboration";

export type FieldKind = "short" | "long" | "metrics";

export interface WorkField {
  id: string;
  label: string;
  placeholder: string;
  kind: FieldKind;
  required?: boolean;
}

export interface RolePreset {
  id: string;
  name: string;
  shortName: string;
  summary: string;
  fieldHint: string;
  fields: WorkField[];
  reportGuidance: Record<ReportType, string[]>;
  scoreWeights: Record<ScoreDimensionId, number>;
}

export interface RoleProfile {
  id: string;
  name: string;
  presetId: string;
  title: string;
  responsibilities: string;
  projectContext: string;
  metrics: string;
  tone: string;
  createdAt: string;
  updatedAt: string;
}

export interface BossPersona {
  id: string;
  name: string;
  description: string;
  tags: Record<BossTagId, number>;
  avoidances: string;
  tone: string;
  density: "low" | "medium" | "high";
  createdAt: string;
  updatedAt: string;
}

export interface WorkInput {
  reportType: ReportType;
  playbookId?: string;
  statusHealth?: ReportHealth;
  goalStatement?: string;
  decisionRequest?: string;
  periodStart: string;
  periodEnd: string;
  fields: Record<string, string>;
  extraText: string;
  historyFrom?: string;
  historyTo?: string;
}

export interface ScoreDimension {
  id: ScoreDimensionId;
  name: string;
  score: number;
  reason: string;
  suggestion: string;
}

export interface ReportScore {
  id: string;
  reportId: string;
  target: "draft" | "optimized";
  total: number;
  dimensions: ScoreDimension[];
  suggestions: string[];
  summary: string;
  createdAt: string;
}

export interface ReportRecord {
  id: string;
  type: ReportType;
  periodStart: string;
  periodEnd: string;
  rolePresetId: string;
  roleProfileId?: string;
  bossPersonaId?: string;
  provider: string;
  model: string;
  input: WorkInput;
  roleProfile: Partial<RoleProfile>;
  bossPersona: BossPersona;
  content: string;
  optimizedContent?: string;
  scores: ReportScore[];
  createdAt: string;
  updatedAt: string;
}

export interface UserFeedbackInput {
  rating: number;
  rolePresetId: string;
  reportType: string;
  painPoint: string;
  usefulParts: string;
  missingParts: string;
  contact?: string;
}

export interface UserFeedback extends UserFeedbackInput {
  id: string;
  contact: string;
  createdAt: string;
}

export interface ProviderInfo {
  id: string;
  name: string;
  baseUrl: string;
  apiKeyEnv: string;
  defaultModel: string;
  configured: boolean;
  models: string[];
}
