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
 * Enter animation when the element scrolls into view (IntersectionObserver).
 * Falls back to immediate visibility if IO is unavailable.
 */
export function AnalogReveal({ children, className, delay = 0 }: AnalogRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const show = () => node.classList.add("analog-enter-visible");

    if (typeof IntersectionObserver === "undefined") {
      const frame = requestAnimationFrame(show);
      return () => cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            show();
            observer.disconnect();
            break;
          }
        }
      },
      { rootMargin: "-10% 0px", threshold: 0.08 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={cn("analog-enter", delay > 0 ? delayClass[delay] : null, className)}>
      {children}
    </div>
  );
}
