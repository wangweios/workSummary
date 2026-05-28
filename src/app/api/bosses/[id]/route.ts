import { NextRequest, NextResponse } from "next/server";
import { deleteBossPersona, updateBossPersona } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json();
  const boss = updateBossPersona(id, body);
  if (!boss) return NextResponse.json({ error: "未找到老板人设。" }, { status: 404 });
  return NextResponse.json({ boss });
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const deleted = deleteBossPersona(id);
  if (!deleted) return NextResponse.json({ error: "未找到老板人设。" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
