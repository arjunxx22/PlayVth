"use client";
import { motion, useReducedMotion } from "motion/react";

/** Circle that draws itself, then a tick. */
export default function SuccessCheck({ size = 72 }: { size?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.svg width={size} height={size} viewBox="0 0 72 72" initial={reduce ? false : { scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 18 }} aria-hidden>
      <motion.circle cx="36" cy="36" r="31" fill="none" stroke="#10b981" strokeWidth="5" strokeLinecap="round"
        initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.7, ease: "easeOut" }} />
      <motion.path d="M22 37 L32 47 L51 27" fill="none" stroke="#10b981" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"
        initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.45, delay: 0.55, ease: "easeOut" }} />
    </motion.svg>
  );
}
