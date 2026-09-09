import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listCities, listSports, userSkills } from "@/lib/queries";
import ProfileForm from "@/components/ProfileForm";
export const metadata: Metadata = { title: "Edit profile" };
export default async function EditProfile() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/profile/edit");
  const skills = Object.fromEntries(userSkills(user.id).map((s) => [s.sport_id, s.level]));
  return (
    <div className="container-x py-8"><div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-extrabold">{user.name ? "Edit profile" : "Welcome! Tell us about you"}</h1>
      <ProfileForm user={{ name: user.name ?? "", email: user.email ?? "", city_id: user.city_id ?? 0 }} cities={listCities()} sports={listSports()} skills={skills} />
    </div></div>
  );
}
