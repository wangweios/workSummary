import { NextRequest, NextResponse } from "next/server";
import { analyzeWorkInput } from "@/lib/input-preflight";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json(
      analyzeWorkInput({
        rolePresetId: String(body.rolePresetId || ""),
        workInput: body.workInput
      })
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "输入体检失败。" },
      { status: 400 }
    );
  }
}
