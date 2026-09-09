import { NextRequest, NextResponse } from "next/server";
import { listVenues } from "@/lib/queries";
export function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const venues = listVenues({ citySlug: sp.get("city") ?? undefined, sportSlug: sp.get("sport") ?? undefined, q: sp.get("q") ?? undefined, sort: sp.get("sort") ?? undefined, maxPrice: sp.get("max") ? Number(sp.get("max")) : undefined })
    .map((v) => ({ ...v, amenities: JSON.parse(v.amenities) }));
  return NextResponse.json({ venues });
}
