"use client";
import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

/** Counts from 0 to `to` when scrolled into view (or when `to` changes). */
export default function CountUp({ to, prefix = "", suffix = "", duration = 1.2, className, decimals = 0, locale = "en-IN", animateOnMount = true }:
  { to: number; prefix?: string; suffix?: string; duration?: number; className?: string; decimals?: number; locale?: string; animateOnMount?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20px" });
  const reduce = useReducedMotion();
  const [val, setVal] = useState(reduce || !animateOnMount ? to : 0);
  const from = useRef(animateOnMount ? 0 : to);
  useEffect(() => {
    if (!inView) return;
    if (reduce) { setVal(to); return; }
    const controls = animate(from.current, to, { duration, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => setVal(v) });
    from.current = to;
    return () => controls.stop();
  }, [inView, to, duration, reduce]);
  return <span ref={ref} className={className} style={{ fontVariantNumeric: "tabular-nums" }}>{prefix}{val.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</span>;
}
