import { VideoPresets } from "livekit-client";

export type StudioQuality = "720p" | "1080p" | "4k";

const QUALITY_PRESETS: Record<
  string,
  { resolution: { width: number; height: number }; maxBitrate: number }
> = {
  "720p": { resolution: VideoPresets.h720.resolution, maxBitrate: 1_200_000 },
  "1080p": { resolution: VideoPresets.h1080.resolution, maxBitrate: 2_500_000 },
  "4k": { resolution: VideoPresets.h2160.resolution, maxBitrate: 5_000_000 },
};

export function resolveQualityConfig(quality: StudioQuality) {
  return QUALITY_PRESETS[quality] ?? QUALITY_PRESETS["720p"]!;
}
