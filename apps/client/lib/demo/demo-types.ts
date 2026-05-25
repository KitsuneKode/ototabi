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
