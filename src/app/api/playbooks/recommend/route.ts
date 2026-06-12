import { NextRequest, NextResponse } from "next/server";
import { recommendMarketPlaybook } from "@/lib/playbook-recommender";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({
      recommendation: recommendMarketPlaybook({
        rolePresetId: String(body.rolePresetId || ""),
        reportType: body.reportType || body.workInput?.reportType || "daily",
        workInput: body.workInput
      })
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "推荐汇报打法失败。" },
      { status: 400 }
    );
  }
}
