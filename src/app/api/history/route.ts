import { NextRequest, NextResponse } from "next/server";
import { listReports } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const reports = listReports({
    limit: Number(params.get("limit") || 30),
    type: params.get("type") || undefined,
    from: params.get("from") || undefined,
    to: params.get("to") || undefined
  });
  return NextResponse.json({ reports });
}
