import { NextRequest, NextResponse } from "next/server";
import { optimizeReport } from "@/lib/report-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await optimizeReport(body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "优化失败。" },
      { status: 400 }
    );
  }
}
