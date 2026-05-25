import type { CursorEvent } from "@/lib/demo/demo-types";

const THROTTLE_MS = 33; // ~30 fps

export class DemoCursorLogger {
  private events: CursorEvent[] = [];
  private startedAt = 0;
  private lastEmitAt = 0;
  private boundMove: (e: PointerEvent) => void;
  private boundDown: (e: PointerEvent) => void;
  private boundUp: (e: PointerEvent) => void;

  constructor() {
    this.boundMove = (e) => this.handlePointer(e, "move");
    this.boundDown = (e) => this.handlePointer(e, "down");
    this.boundUp = (e) => this.handlePointer(e, "up");
  }

  start() {
    this.events = [];
    this.startedAt = performance.now();
    this.lastEmitAt = 0;
    window.addEventListener("pointermove", this.boundMove, { passive: true });
    window.addEventListener("pointerdown", this.boundDown, { passive: true });
    window.addEventListener("pointerup", this.boundUp, { passive: true });
  }

  stop(): CursorEvent[] {
    window.removeEventListener("pointermove", this.boundMove);
    window.removeEventListener("pointerdown", this.boundDown);
    window.removeEventListener("pointerup", this.boundUp);
    return [...this.events];
  }

  getEvents(): CursorEvent[] {
    return [...this.events];
  }

  private handlePointer(e: PointerEvent, type: CursorEvent["type"]) {
    const now = performance.now();
    if (type === "move" && now - this.lastEmitAt < THROTTLE_MS) return;
    this.lastEmitAt = now;

    this.events.push({
      t: Math.round(now - this.startedAt),
      x: Math.round(e.clientX),
      y: Math.round(e.clientY),
      type,
      ...(type !== "move" ? { button: e.button } : {}),
    });
  }
}
