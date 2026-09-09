"use client";
import { useActionState } from "react";
import { updateProfile, type ActionState } from "@/lib/actions";
import { Alert } from "./ui";
type Opt = { id: number; name: string; icon?: string };
export default function ProfileForm(p: { user: { name: string; email: string; city_id: number }; cities: Opt[]; sports: Opt[]; skills: Record<number, string> }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateProfile, {});
  return (
    <form action={action} className="card mt-6 space-y-5 p-6">
      {state.error && <Alert kind="error">{state.error}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label">Name</label><input name="name" className="input" defaultValue={p.user.name} required minLength={2} /></div>
        <div><label className="label">Email (optional)</label><input name="email" type="email" className="input" defaultValue={p.user.email} /></div>
        <div><label className="label">Home city</label><select name="city_id" className="input" defaultValue={p.user.city_id || ""}>{p.cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
      </div>
      <div>
        <label className="label">Sports you play &amp; your level</label>
        <div className="grid gap-2 sm:grid-cols-2">{p.sports.map((s) => (
          <div key={s.id} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm"><span className="flex-1">{s.icon} {s.name}</span>
            <select name={`skill_${s.id}`} className="input w-36 py-1" defaultValue={p.skills[s.id] ?? "none"}><option value="none">Don&apos;t play</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></div>))}</div>
      </div>
      <button className="btn-primary w-full" disabled={pending}>{pending ? "Saving…" : "Save profile"}</button>
    </form>
  );
}
