import { NextRequest, NextResponse } from "next/server";
import { courtsForVenue, getVenue } from "@/lib/queries";
import { slotsForCourt } from "@/lib/slots";
import { isValidISODate, todayISO } from "@/lib/time";
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const v = getVenue((await params).slug);
  if (!v) return NextResponse.json({ error: "Venue not found" }, { status: 404 });
  const date = req.nextUrl.searchParams.get("date") ?? todayISO();
  if (!isValidISODate(date)) return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  const sport = req.nextUrl.searchParams.get("sport");
  const sportId = sport ? v.sports.find((s) => s.slug === sport)?.id : undefined;
  const courts = courtsForVenue(v.id, sportId).map((c) => ({ id: c.id, name: c.name, sport_id: c.sport_id, slots: slotsForCourt(c.id, date, v.open_hour, v.close_hour) }));
  return NextResponse.json({ venue: { id: v.id, slug: v.slug, name: v.name }, date, courts });
}
