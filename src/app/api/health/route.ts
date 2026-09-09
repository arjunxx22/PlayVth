import { NextResponse } from "next/server";
import { get } from "@/lib/db";
export function GET() {
  const venues = get<{ n: number }>("SELECT COUNT(*) AS n FROM venues")?.n ?? 0;
  return NextResponse.json({ ok: true, venues, time: new Date().toISOString() });
}
