"use client";
import Link from "next/link";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { useEffect } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

/** Headline whose words rise in one by one; the accent word gets a gradient sweep. */
export function AnimatedHeadline({ words, accentIndex }: { words: string[]; accentIndex: number }) {
  const reduce = useReducedMotion();
  return (
    <h1 className="mt-4 text-4xl font-extrabold leading-tight sm:text-6xl" aria-label={words.join(" ")}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pr-[0.25em] align-bottom">
          <motion.span className={`inline-block ${i === accentIndex ? "text-gradient" : ""}`}
            initial={reduce ? false : { y: "110%", rotate: 4 }} animate={{ y: 0, rotate: 0 }} transition={{ duration: 0.8, delay: 0.15 + i * 0.12, ease }}>
            {w}
          </motion.span>
        </span>
      ))}
    </h1>
  );
}

export function FadeIn({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return <motion.div className={className} initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay, ease }}>{children}</motion.div>;
}

/** Sport tiles that float, tilt toward the cursor, and pop on hover. */
export function FloatingSports({ sports }: { sports: { slug: string; name: string; icon: string }[] }) {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0), my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-1, 1], [8, -8]), { stiffness: 120, damping: 18 });
  const ry = useSpring(useTransform(mx, [-1, 1], [-10, 10]), { stiffness: 120, damping: 18 });
  useEffect(() => {
    if (reduce) return;
    const onMove = (e: MouseEvent) => { mx.set((e.clientX / window.innerWidth) * 2 - 1); my.set((e.clientY / window.innerHeight) * 2 - 1); };
    window.addEventListener("mousemove", onMove); return () => window.removeEventListener("mousemove", onMove);
  }, [mx, my, reduce]);
  return (
    <motion.div className="grid grid-cols-5 gap-2 sm:gap-3" style={reduce ? undefined : { rotateX: rx, rotateY: ry, transformPerspective: 900 }}>
      {sports.map((s, i) => (
        <motion.div key={s.slug} initial={reduce ? false : { opacity: 0, y: 30, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.4 + i * 0.06, type: "spring", stiffness: 260, damping: 20 }}>
          <motion.div animate={reduce ? undefined : { y: [0, -6, 0] }} transition={{ duration: 3 + (i % 4) * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}>
            <Link href={`/venues?sport=${s.slug}`} className="group flex flex-col items-center gap-1 rounded-2xl border border-white/10 bg-white/5 p-3 text-center backdrop-blur-sm transition-colors hover:border-brand-500/60 hover:bg-brand-600/20">
              <motion.span className="text-3xl" whileHover={{ scale: 1.35, rotate: [0, -12, 12, 0] }} transition={{ duration: 0.5 }}>{s.icon}</motion.span>
              <span className="text-[11px] font-medium text-slate-200 group-hover:text-white">{s.name}</span>
            </Link>
          </motion.div>
        </motion.div>
      ))}
    </motion.div>
  );
}

/** Slow-moving gradient blobs behind the hero. */
export function HeroBackdrop() {
  const reduce = useReducedMotion();
  const blob = (cls: string, dur: number, path: number[][]) => (
    <motion.div className={`absolute rounded-full blur-3xl ${cls}`} aria-hidden
      animate={reduce ? undefined : { x: path.map((p) => p[0]), y: path.map((p) => p[1]), scale: [1, 1.15, 0.95, 1] }}
      transition={{ duration: dur, repeat: Infinity, ease: "easeInOut" }} />
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {blob("-left-24 -top-24 h-96 w-96 bg-brand-500/30", 18, [[0, 0], [80, 40], [20, 90], [0, 0]])}
      {blob("right-0 top-1/3 h-80 w-80 bg-emerald-300/20", 22, [[0, 0], [-60, 30], [-20, -50], [0, 0]])}
      {blob("bottom-0 left-1/3 h-72 w-72 bg-sky-400/20", 26, [[0, 0], [50, -30], [-40, 20], [0, 0]])}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_40%,rgba(15,23,42,.6))]" />
    </div>
  );
}
