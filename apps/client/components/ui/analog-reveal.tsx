"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

interface AnalogRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: 0 | 1 | 2 | 3 | 4 | 5;
}

const delayClass: Record<NonNullable<AnalogRevealProps["delay"]>, string> = {
  0: "",
  1: "analog-enter-delay-1",
  2: "analog-enter-delay-2",
  3: "analog-enter-delay-3",
  4: "analog-enter-delay-4",
  5: "analog-enter-delay-5",
};

/**
 * Stagger-friendly enter animation. Adds `analog-enter-visible` after mount
 * so first paint does not flash unstyled content on hydration.
 */
export function AnalogReveal({ children, className, delay = 0 }: AnalogRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const frame = requestAnimationFrame(() => {
      node.classList.add("analog-enter-visible");
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div ref={ref} className={cn("analog-enter", delay > 0 ? delayClass[delay] : null, className)}>
      {children}
    </div>
  );
}
