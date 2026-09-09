"use client";
import { motion, useReducedMotion, type Variants } from "motion/react";
import type { ReactNode } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

/** Fade + rise when the element scrolls into view. */
export function Reveal({ children, delay = 0, className, y = 24, once = true }: { children: ReactNode; delay?: number; className?: string; y?: number; once?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <motion.div className={className} initial={reduce ? false : { opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-40px" }} transition={{ duration: 0.6, delay, ease }}>
      {children}
    </motion.div>
  );
}

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } } };
const item: Variants = { hidden: { opacity: 0, y: 22, scale: 0.98 }, show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease } } };

/** Grid/list whose children pop in one after another. */
export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div className={className} variants={reduce ? undefined : container} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-40px" }}>
      {children}
    </motion.div>
  );
}
export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return <motion.div className={className} variants={item}>{children}</motion.div>;
}

/** Lifts on hover, presses on tap. Wrap cards and tiles. */
export function Hover({ children, className, lift = 6 }: { children: ReactNode; className?: string; lift?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div className={className} whileHover={reduce ? undefined : { y: -lift, scale: 1.012 }} whileTap={reduce ? undefined : { scale: 0.985 }}
      transition={{ type: "spring", stiffness: 380, damping: 26 }}>
      {children}
    </motion.div>
  );
}

/** Pops in with a spring; use for badges and status chips that appear after an action. */
export function Pop({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 420, damping: 22, delay }}>
      {children}
    </motion.div>
  );
}
