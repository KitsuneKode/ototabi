export type CursorEvent = {
  t: number;
  x: number;
  y: number;
  type: "move" | "down" | "up";
  button?: number;
};

export type ZoomRegion = {
  id: string;
  startMs: number;
  endMs: number;
  scale: number;
};

export type DemoBackground = {
  type: "solid" | "gradient";
  value: string;
};

/** Allowed playback speeds for demo export (FFmpeg setpts + atempo). */
export const DEMO_PLAYBACK_SPEEDS = [0.75, 1, 1.25, 1.5, 2] as const;
export type DemoPlaybackSpeed = (typeof DEMO_PLAYBACK_SPEEDS)[number];
