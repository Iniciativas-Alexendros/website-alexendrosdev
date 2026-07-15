"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { type FC, type ReactNode } from "react";

interface RevealProps extends Omit<
  HTMLMotionProps<"div">,
  "whileInView" | "viewport" | "initial" | "animate"
> {
  children: ReactNode;
  delay?: number;
  duration?: number;
  y?: number;
  className?: string;
}

export const Reveal: FC<RevealProps> = ({
  children,
  delay = 0,
  duration = 0.6,
  y = 20,
  className,
  ...props
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};
