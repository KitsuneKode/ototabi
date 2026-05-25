import type { CursorEvent, ZoomRegion } from "@/lib/demo/demo-types";

const CLUSTER_GAP_MS = 800;
const MIN_REGION_MS = 1500;
const REGION_PADDING_MS = 400;
const DEFAULT_SCALE = 1.5;
const MIN_EVENTS_PER_CLUSTER = 3;

/**
 * Heuristic: cluster pointer-down bursts and high-movement windows into zoom regions.
 * User confirms in editor before save.
 */
export function suggestZoomRegionsFromCursor(events: CursorEvent[]): ZoomRegion[] {
  if (events.length < MIN_EVENTS_PER_CLUSTER) return [];

  const anchors: number[] = [];
  for (const ev of events) {
    if (ev.type === "down") anchors.push(ev.t);
  }

  if (anchors.length === 0) {
    let clusterStart = events[0]!.t;
    let prev = events[0]!;
    for (let i = 1; i < events.length; i++) {
      const ev = events[i]!;
      const dt = ev.t - prev.t;
      const dist = Math.hypot(ev.x - prev.x, ev.y - prev.y);
      if (dt > CLUSTER_GAP_MS || dist > 0.12) {
        if (i - 1 >= MIN_EVENTS_PER_CLUSTER) anchors.push(clusterStart);
        clusterStart = ev.t;
      }
      prev = ev;
    }
  }

  const clusters: number[][] = [];
  let current: number[] = [];
  for (const t of anchors.toSorted((a, b) => a - b)) {
    if (current.length === 0 || t - current[current.length - 1]! <= CLUSTER_GAP_MS) {
      current.push(t);
    } else {
      if (current.length > 0) clusters.push(current);
      current = [t];
    }
  }
  if (current.length > 0) clusters.push(current);

  return clusters.map((cluster) => {
    const mid = cluster[Math.floor(cluster.length / 2)]!;
    const startMs = Math.max(0, mid - REGION_PADDING_MS);
    const endMs = startMs + Math.max(MIN_REGION_MS, REGION_PADDING_MS * 2);
    return {
      id: crypto.randomUUID(),
      startMs,
      endMs,
      scale: DEFAULT_SCALE,
    };
  });
}
