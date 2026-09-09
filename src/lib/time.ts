// All business times are in India Standard Time (Asia/Kolkata), like Playo.
export const TZ = "Asia/Kolkata";

export function nowIST(): { date: string; hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date());
  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) % 24, minute: Number(p.minute) };
}

export function todayISO(): string {
  return nowIST().date;
}

export function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function dayType(iso: string): "weekday" | "weekend" {
  const d = new Date(iso + "T00:00:00Z").getUTCDay();
  return d === 0 || d === 6 ? "weekend" : "weekday";
}

export function fmtDate(iso: string, opts: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" }): string {
  return new Intl.DateTimeFormat("en-IN", { timeZone: "UTC", ...opts }).format(new Date(iso + "T00:00:00Z"));
}

export function fmtHour(h: number): string {
  const hh = ((h % 24) + 24) % 24;
  const suffix = hh >= 12 ? "PM" : "AM";
  const disp = hh % 12 === 0 ? 12 : hh % 12;
  return `${disp}:00 ${suffix}`;
}

export function fmtRange(start: number, end: number): string {
  return `${fmtHour(start)} – ${fmtHour(end)}`;
}

/** Minutes from now (IST) until a given date+hour. Negative if in the past. */
export function minutesUntil(date: string, hour: number): number {
  const n = nowIST();
  const days = (new Date(date + "T00:00:00Z").getTime() - new Date(n.date + "T00:00:00Z").getTime()) / 86400000;
  return days * 1440 + hour * 60 - (n.hour * 60 + n.minute);
}

export function fmtINR(n: number): string {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

export function isValidISODate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(s + "T00:00:00Z").getTime());
}
