import type { CSSProperties } from "react";

import type { DemoBackground } from "@/lib/demo/demo-types";

export const DEMO_BACKGROUND_PRESETS: DemoBackground[] = [
  { type: "solid", value: "#0a0a0a" },
  { type: "solid", value: "#1a1510" },
  { type: "gradient", value: "linear-gradient(135deg,#0a0a0a 0%,#1f2937 50%,#0a0a0a 100%)" },
  { type: "gradient", value: "linear-gradient(180deg,#1a1510 0%,#0a0a0a 60%,#111827 100%)" },
  { type: "gradient", value: "linear-gradient(135deg,#111827 0%,#7c2d12 40%,#0a0a0a 100%)" },
];

export function backgroundToStyle(bg: DemoBackground): CSSProperties {
  if (bg.type === "gradient") {
    return { background: bg.value };
  }
  return { backgroundColor: bg.value };
}
