import { NextRequest, NextResponse } from "next/server";
import { listGames } from "@/lib/queries";
export function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  return NextResponse.json({ games: listGames({ citySlug: sp.get("city") ?? undefined, sportSlug: sp.get("sport") ?? undefined, skill: sp.get("skill") ?? undefined, date: sp.get("date") ?? undefined }) });
}
