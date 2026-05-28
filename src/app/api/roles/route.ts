import { NextRequest, NextResponse } from "next/server";
import { createRoleProfile, listRoleProfiles } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ roles: listRoleProfiles() });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json({ role: createRoleProfile(body) }, { status: 201 });
}
