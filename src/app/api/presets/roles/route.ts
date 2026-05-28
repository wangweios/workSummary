import { NextResponse } from "next/server";
import { rolePresets } from "@/lib/role-presets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ roles: rolePresets });
}
