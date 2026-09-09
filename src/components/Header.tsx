import Link from "next/link";
import { getCitySlug, getCurrentUser } from "@/lib/auth";
import { listCities } from "@/lib/queries";
import { logout } from "@/lib/actions";
import CitySelect from "./CitySelect";

export default async function Header() {
  const [user, citySlug] = await Promise.all([getCurrentUser(), getCitySlug()]);
  const cities = listCities();
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="container-x flex h-16 items-center gap-4">
        <Link href="/" className="flex items-center gap-2 font-extrabold text-xl tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">P</span>
          <span>Play<span className="text-brand-600">Vth</span></span>
        </Link>
        <CitySelect cities={cities} current={citySlug} />
        <nav className="ml-auto hidden md:flex items-center gap-1 text-sm font-medium">
          <Link href="/venues" className="btn-ghost">Book</Link>
          <Link href="/play" className="btn-ghost">Play</Link>
          <Link href="/coaching" className="btn-ghost">Learn</Link>
          <Link href="/partner" className="btn-ghost">List your venue</Link>
        </nav>
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
      <nav className="md:hidden border-t border-slate-100 flex text-sm font-medium">
        {[["/venues", "Book"], ["/play", "Play"], ["/coaching", "Learn"], ["/partner", "Partner"]].map(([h, l]) => (
          <Link key={h} href={h} className="flex-1 py-2 text-center hover:bg-slate-50">{l}</Link>
        ))}
      </nav>
    </header>
  );
}
