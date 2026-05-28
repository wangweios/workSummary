import { NextRequest, NextResponse } from "next/server";
import { createBossPersona, listBossPersonas } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ bosses: listBossPersonas() });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json({ boss: createBossPersona(body) }, { status: 201 });
}
