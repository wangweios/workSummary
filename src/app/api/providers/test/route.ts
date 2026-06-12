import { NextRequest, NextResponse } from "next/server";
import { testProviderConnection } from "@/lib/ai/providers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await testProviderConnection({
      providerId: String(body.providerId || ""),
      model: typeof body.model === "string" ? body.model : undefined
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { ok: false, configured: false, message: error instanceof Error ? error.message : "Provider test failed." },
      { status: 400 }
    );
  }
}
