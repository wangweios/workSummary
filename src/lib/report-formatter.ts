import type { ReportType } from "@/lib/types";
import { reportTypeLabel } from "@/lib/utils";

export type ReportOutputFormat = "markdown" | "im" | "email";

export function formatReportOutput(input: {
  content: string;
  format: ReportOutputFormat;
  reportType?: ReportType;
  recipient?: string;
}) {
  const content = String(input.content || "").trim();
  if (!content) return "";

  if (input.format === "markdown") return content;
  if (input.format === "email") {
    return formatEmail(content, input.reportType, input.recipient);
  }
  return formatIm(content);
}

function formatIm(content: string) {
  return content
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/^\s*[-*]\s+/gm, "• ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function formatEmail(content: string, reportType: ReportType | undefined, recipient?: string) {
  const subjectLabel = reportType ? reportTypeLabel(reportType) : "工作汇报";
  const body = formatIm(content);
  const greeting = recipient?.trim() ? `${recipient.trim()}，您好：` : "领导您好：";
  return [
    `主题：${subjectLabel}汇报`,
    "",
    greeting,
    "",
    body,
    "",
    "以上，请查阅。"
  ].join("\n");
}
