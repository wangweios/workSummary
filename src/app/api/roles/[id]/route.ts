import { NextRequest, NextResponse } from "next/server";
import { deleteRoleProfile, updateRoleProfile } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json();
  const role = updateRoleProfile(id, body);
  if (!role) return NextResponse.json({ error: "未找到身份配置。" }, { status: 404 });
  return NextResponse.json({ role });
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const deleted = deleteRoleProfile(id);
  if (!deleted) return NextResponse.json({ error: "未找到身份配置。" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
