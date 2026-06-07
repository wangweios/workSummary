import { NextRequest, NextResponse } from "next/server";
import { createFeedback, listFeedback } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const limit = Number(request.nextUrl.searchParams.get("limit") || 50);
  return NextResponse.json({ feedback: listFeedback({ limit }) });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.painPoint && !body.usefulParts && !body.missingParts) {
      return NextResponse.json({ error: "请至少填写一个反馈点。" }, { status: 400 });
    }
    return NextResponse.json({ feedback: createFeedback(body) }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "保存反馈失败。" },
      { status: 400 }
    );
  }
}
