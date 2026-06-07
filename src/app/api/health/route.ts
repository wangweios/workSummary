import { NextResponse } from "next/server";
import { listProviders } from "@/lib/ai/providers";
import { getStorageHealth } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(getStorageHealth(listProviders()));
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "健康检查失败。"
      },
      { status: 500 }
    );
  }
}
