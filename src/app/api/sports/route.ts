import { NextResponse } from "next/server";
import { listCities, listSports } from "@/lib/queries";
export function GET() {
  return NextResponse.json({ sports: listSports(), cities: listCities() });
}
