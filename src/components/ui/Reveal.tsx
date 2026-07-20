"use client";

import { motion, useReducedMotion } from "framer-motion";
import { type FC, type ReactNode } from "react";
import { easing } from "@/tokens";

interface RevealProps {
  children: ReactNode;
  /** Delay in seconds before animation starts */
  delay?: number;
  /** Duration in seconds */
  duration?: number;
  /** Start Y offset in pixels */
  y?: number;
  className?: string;
  as?: "div" | "section" | "article" | "header" | "footer" | "aside" | "main" | "nav";
}

/**
 * Reveal — fade-in + slide-up animation on scroll into view.
 * Uses @/tokens easing for brand-consistent motion.
 */
export const Reveal: FC<RevealProps> = ({
  children,
  delay = 0,
  duration = 0.6,
  y = 20,
  className,
}) => {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        duration,
        delay,
        // Referencia al easing por defecto del design system
        ease: easing.default
          .match(/cubic-bezier\(([^)]+)\)/)!
          .slice(1)[0]!
          .split(",")
          .map(Number) as [number, number, number, number],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
