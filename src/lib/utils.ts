import type { ReportType } from "@/lib/types";

export function createId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 18)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function reportTypeLabel(type: ReportType): string {
  const labels: Record<ReportType, string> = {
    daily: "日报",
    weekly: "周报",
    monthly: "月报"
  };
  return labels[type];
}

export function clampScore(value: unknown): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

export function requireText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
