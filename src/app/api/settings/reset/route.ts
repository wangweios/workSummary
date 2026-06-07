import { NextResponse } from "next/server";
import { clearWorkspaceData } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE() {
  return NextResponse.json(clearWorkspaceData());
}
