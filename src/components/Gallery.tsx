"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { VenuePhoto } from "@/lib/queries";
import { photoUrl } from "@/lib/photo-url";

/** Thumbnail strip with a lightbox. */
export default function Gallery({ photos, name }: { photos: VenuePhoto[]; name: string }) {
  const [open, setOpen] = useState<number | null>(null);
  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(null); if (e.key === "ArrowRight") setOpen((i) => (i === null ? null : (i + 1) % photos.length)); if (e.key === "ArrowLeft") setOpen((i) => (i === null ? null : (i - 1 + photos.length) % photos.length)); };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [open, photos.length]);
  if (!photos.length) return null;
  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {photos.map((p, i) => (
          <motion.button key={p.id} type="button" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={() => setOpen(i)} className="shrink-0 overflow-hidden rounded-xl border border-slate-200">
            <img src={photoUrl(p.thumb)} alt={`${name} photo ${i + 1}`} className="h-24 w-36 object-cover" loading="lazy" />
          </motion.button>
        ))}
      </div>
      <AnimatePresence>
        {open !== null && (
          <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/85 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(null)} role="dialog" aria-label="Photo viewer">
            <motion.img key={photos[open].id} src={photoUrl(photos[open].file)} alt={`${name} photo ${open + 1}`} className="max-h-[85vh] max-w-full rounded-xl shadow-2xl"
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 26 }} onClick={(e) => e.stopPropagation()} />
            <div className="absolute bottom-6 text-sm text-white/80">{open + 1} / {photos.length} · tap outside to close</div>
            <button type="button" className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/15 px-3 py-2 text-white" onClick={(e) => { e.stopPropagation(); setOpen((open - 1 + photos.length) % photos.length); }} aria-label="Previous">‹</button>
            <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/15 px-3 py-2 text-white" onClick={(e) => { e.stopPropagation(); setOpen((open + 1) % photos.length); }} aria-label="Next">›</button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
