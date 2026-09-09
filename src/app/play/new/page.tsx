import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCitySlug, getCurrentUser } from "@/lib/auth";
import { cityBySlug, listCities, listSports, listVenues } from "@/lib/queries";
import { addDays, todayISO } from "@/lib/time";
import HostGameForm from "@/components/HostGameForm";

export const metadata: Metadata = { title: "Host a game" };

export default async function NewGamePage({ searchParams }: { searchParams: Promise<{ venue?: string; sport?: string }> }) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/play/new");
  const citySlug = await getCitySlug();
  const city = cityBySlug(citySlug);
  const venues = listVenues({ citySlug }).map((v) => ({ id: v.id, name: `${v.name}, ${v.area}` }));
  return (
    <div className="container-x py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-extrabold">Host a game</h1>
        <p className="mt-1 text-slate-500">Set the sport, time and skill level. Players send requests and you decide who joins. Free games auto-accept.</p>
        <HostGameForm sports={listSports()} cities={listCities()} venues={venues} defaultCityId={user.city_id ?? city?.id ?? 1}
          defaultVenueId={Number(sp.venue) || 0} defaultSportId={Number(sp.sport) || 0} minDate={todayISO()} maxDate={addDays(todayISO(), 30)} />
      </div>
    </div>
  );
}
