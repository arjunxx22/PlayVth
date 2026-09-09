"use client";
import confetti from "canvas-confetti";
import { useEffect } from "react";
import { useReducedMotion } from "motion/react";

/** Fires a celebratory burst once on mount. */
export default function Confetti() {
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) return;
    const colors = ["#059669", "#10b981", "#a7f3d0", "#fbbf24", "#ffffff"];
    confetti({ particleCount: 90, spread: 70, origin: { y: 0.35 }, colors, scalar: 1.1 });
    const t1 = setTimeout(() => confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0, y: 0.6 }, colors }), 250);
    const t2 = setTimeout(() => confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1, y: 0.6 }, colors }), 400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [reduce]);
  return null;
}
