import { NextRequest, NextResponse } from "next/server";
import { formatReportOutput, type ReportOutputFormat } from "@/lib/report-formatter";
import type { ReportType } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const content = String(body.content || "");
    const format = String(body.format || "markdown") as ReportOutputFormat;
    if (!["markdown", "im", "email"].includes(format)) {
      return NextResponse.json({ error: "不支持的复制格式。" }, { status: 400 });
    }
    return NextResponse.json({
      content: formatReportOutput({
        content,
        format,
        reportType: body.reportType as ReportType | undefined,
        recipient: typeof body.recipient === "string" ? body.recipient : undefined
      })
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "格式化报告失败。" },
      { status: 400 }
    );
  }
}
