import { NextResponse } from "next/server";
import { exportWorkspaceData } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(exportWorkspaceData(), {
    headers: {
      "Content-Disposition": `attachment; filename="work-summary-export-${new Date().toISOString().slice(0, 10)}.json"`
    }
  });
}
