import { NextRequest, NextResponse } from "next/server";
import { extractWorkFields } from "@/lib/input-extractor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rolePresetId = String(body.rolePresetId || "");
    const text = String(body.text || "");
    return NextResponse.json(extractWorkFields({ rolePresetId, text }));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "拆解材料失败。" },
      { status: 400 }
    );
  }
}
