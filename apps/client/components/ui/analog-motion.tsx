"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";

import { cn } from "@/lib/utils";

const MECHANICAL_EASE = [0.1, 0.9, 0.2, 1] as const;

type AnalogMotionRevealProps = HTMLMotionProps<"div"> & {
  delay?: number;
  staggerIndex?: number;
};

/**
 * Scroll-triggered enter for marketing sections. Respects prefers-reduced-motion.
 */
export function AnalogMotionReveal({
  children,
  className,
  delay = 0,
  staggerIndex = 0,
  ...props
}: AnalogMotionRevealProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{
        duration: reduceMotion ? 0 : 0.55,
        delay: reduceMotion ? 0 : delay + staggerIndex * 0.08,
        ease: MECHANICAL_EASE,
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

type AnalogStaggerProps = {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
};

/**
 * Parent wrapper that staggers direct motion children (use with AnalogMotionReveal staggerIndex).
 */
export function AnalogStagger({ children, className }: AnalogStaggerProps) {
  return <div className={cn(className)}>{children}</div>;
}
