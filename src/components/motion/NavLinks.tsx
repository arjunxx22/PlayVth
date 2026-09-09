"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";

const LINKS = [["/venues", "Book"], ["/play", "Play"], ["/coaching", "Learn"], ["/partner", "List your venue"]] as const;

/** Nav with a pill that slides between the active link. */
export default function NavLinks({ mobile = false }: { mobile?: boolean }) {
  const path = usePathname();
  const active = LINKS.find(([h]) => path === h || path.startsWith(h + "/"))?.[0];
  if (mobile) {
    return (
      <nav className="md:hidden border-t border-slate-100 flex text-sm font-medium">
        {LINKS.map(([h, l]) => (
          <Link key={h} href={h} className={`relative flex-1 py-2 text-center ${active === h ? "text-brand-700" : "text-slate-600"}`}>
            {h === "/partner" ? "Partner" : l}
            {active === h && <motion.span layoutId="mnav" className="absolute inset-x-6 bottom-0 h-0.5 rounded-full bg-brand-600" />}
          </Link>
        ))}
      </nav>
    );
  }
  return (
    <nav className="ml-auto hidden md:flex items-center gap-1 text-sm font-medium">
      {LINKS.map(([h, l]) => (
        <Link key={h} href={h} className={`relative rounded-xl px-4 py-2.5 transition-colors ${active === h ? "text-brand-700" : "text-slate-700 hover:text-ink"}`}>
          {active === h && <motion.span layoutId="nav" className="absolute inset-0 rounded-xl bg-brand-50" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
          <span className="relative">{l}</span>
        </Link>
      ))}
    </nav>
  );
}
