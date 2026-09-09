import Link from "next/link";
export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="container-x grid gap-8 py-10 text-sm sm:grid-cols-4">
        <div>
          <div className="font-extrabold text-lg">Play<span className="text-brand-600">Vth</span></div>
          <p className="mt-2 text-slate-500">Book venues, find players of your level, and get coached. Your sports community.</p>
        </div>
        <div><div className="font-semibold mb-2">Play</div><ul className="space-y-1 text-slate-600">
          <li><Link href="/venues">Book a venue</Link></li><li><Link href="/play">Join a game</Link></li><li><Link href="/play/new">Host a game</Link></li><li><Link href="/coaching">Find a coach</Link></li></ul></div>
        <div><div className="font-semibold mb-2">Business</div><ul className="space-y-1 text-slate-600">
          <li><Link href="/partner">List your venue</Link></li><li><Link href="/partner">Partner dashboard</Link></li></ul></div>
        <div><div className="font-semibold mb-2">Policies</div><ul className="space-y-1 text-slate-600">
          <li><Link href="/policies">Cancellation &amp; refunds</Link></li><li><Link href="/policies#karma">Karma points</Link></li><li><Link href="/privacy">Privacy policy</Link></li><li><Link href="/terms">Terms of service</Link></li></ul></div>
      </div>
      <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-400">© {new Date().getFullYear()} PlayVth</div>
    </footer>
  );
}
