"use client";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { setCity } from "@/lib/actions";

export default function CitySelect({ cities, current }: { cities: { slug: string; name: string }[]; current: string }) {
  const ref = useRef<HTMLFormElement>(null);
  const pathname = usePathname();
  return (
    <form action={setCity} ref={ref} className="flex items-center">
      <input type="hidden" name="back" value={pathname} />
      <span className="mr-1 text-slate-400" aria-hidden>📍</span>
      <select name="city" defaultValue={current} onChange={() => ref.current?.requestSubmit()}
        className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm font-medium" aria-label="Select city">
        {cities.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
      </select>
    </form>
  );
}
