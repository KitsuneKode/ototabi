"use client";

import { cn } from "@ototabi/ui/lib/utils";
import * as React from "react";

function Accordion({ children, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="accordion" {...props}>
      {children}
    </div>
  );
}

function AccordionItem({
  className,
  children,
  ...props
}: React.ComponentProps<"details">) {
  return (
    <details
      data-slot="accordion-item"
      className={cn("border-border border-b", className)}
      {...props}
    >
      {children}
    </details>
  );
}

function AccordionTrigger({ className, children, ...props }: React.ComponentProps<"summary">) {
  return (
    <summary
      data-slot="accordion-trigger"
      className={cn(
        "flex flex-1 cursor-pointer items-center justify-between py-4 text-sm font-bold tracking-wider uppercase transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
        className,
      )}
      {...props}
    >
      {children}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-4 shrink-0 transition-transform duration-200"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </summary>
  );
}

function AccordionContent({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="accordion-content"
      className={cn("overflow-hidden text-sm", className)}
      {...props}
    >
      <div className="pt-0 pb-4">{children}</div>
    </div>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
