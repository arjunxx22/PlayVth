"use client";
import { useRef, useState } from "react";
import { uploadVenuePhotos } from "@/lib/actions";

/** Multi-file picker with local previews; the server action does the resizing. */
export default function PhotoUploader({ venueId, remaining }: { venueId: number; remaining: number }) {
  const [previews, setPreviews] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  return (
    <form action={uploadVenuePhotos} onSubmit={() => setBusy(true)} className="rounded-xl border-2 border-dashed border-slate-300 p-4 text-center">
      <input type="hidden" name="venue_id" value={venueId} />
      <input ref={input} type="file" name="photos" accept="image/jpeg,image/png,image/webp,image/heic" multiple className="hidden" disabled={remaining <= 0}
        onChange={(e) => setPreviews(Array.from(e.target.files ?? []).slice(0, remaining).map((f) => URL.createObjectURL(f)))} />
      {previews.length === 0 ? (
        <button type="button" className="btn-secondary" onClick={() => input.current?.click()} disabled={remaining <= 0}>
          📷 {remaining > 0 ? `Choose photos (up to ${remaining} more)` : "Photo limit reached"}
        </button>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap justify-center gap-2">
            {previews.map((src, i) => <img key={i} src={src} alt="" className="h-20 w-28 rounded-lg object-cover" />)}
          </div>
          <div className="flex justify-center gap-2">
            <button className="btn-primary" disabled={busy}>{busy ? "Uploading…" : `Upload ${previews.length} photo${previews.length === 1 ? "" : "s"}`}</button>
            <button type="button" className="btn-ghost" onClick={() => { setPreviews([]); if (input.current) input.current.value = ""; }} disabled={busy}>Clear</button>
          </div>
        </>
      )}
      <p className="mt-2 text-xs text-slate-400">JPG, PNG, WebP or HEIC · up to 8 MB each · resized automatically. Landscape shots of the courts work best.</p>
    </form>
  );
}
