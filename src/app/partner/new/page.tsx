import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listCities, listSports } from "@/lib/queries";
import VenueForm from "@/components/VenueForm";
export const metadata: Metadata = { title: "List your venue" };
export default async function NewVenue() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/partner/new");
  return (
    <div className="container-x py-8"><div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-extrabold">List your venue</h1>
      <p className="mt-1 text-slate-500">Add your facility, courts and base prices. You can fine-tune peak pricing and block slots from the dashboard afterwards.</p>
      <VenueForm cities={listCities()} sports={listSports()} defaultCityId={user.city_id ?? 1} />
    </div></div>
  );
}
