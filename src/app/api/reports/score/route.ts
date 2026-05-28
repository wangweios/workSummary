import { NextRequest, NextResponse } from "next/server";
import { rescoreReport } from "@/lib/report-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await rescoreReport(body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "评分失败。" },
      { status: 400 }
    );
  }
}
