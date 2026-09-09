import Link from "next/link";
import { getCitySlug, getCurrentUser } from "@/lib/auth";
import { listCities } from "@/lib/queries";
import { logout } from "@/lib/actions";
import CitySelect from "./CitySelect";
import NavLinks from "./motion/NavLinks";

export default async function Header() {
  const [user, citySlug] = await Promise.all([getCurrentUser(), getCitySlug()]);
  const cities = listCities();
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="container-x flex h-16 items-center gap-4">
        <Link href="/" className="group flex items-center gap-2 font-extrabold text-xl tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white transition-transform duration-300 group-hover:rotate-[-8deg] group-hover:scale-110">P</span>
          <span>Play<span className="text-brand-600">Vth</span></span>
        </Link>
        <CitySelect cities={cities} current={citySlug} />
        <NavLinks />
        {user ? (
          <div className="flex items-center gap-2">
            <Link href="/profile" className="btn-secondary">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-100 text-brand-700 text-xs font-bold">
                {(user.name ?? user.phone).slice(0, 1).toUpperCase()}
              </span>
              <span className="hidden sm:inline">{user.name ?? "Profile"}</span>
              <span className="chip bg-amber-100 text-amber-800">⚡ {user.karma}</span>
            </Link>
            <form action={logout}><button className="btn-ghost text-slate-500">Logout</button></form>
          </div>
        ) : (
          <Link href="/login" className="btn-primary whitespace-nowrap"><span className="sm:hidden">Login</span><span className="hidden sm:inline">Login / Sign up</span></Link>
        )}
      </div>
      <NavLinks mobile />
    </header>
  );
}
