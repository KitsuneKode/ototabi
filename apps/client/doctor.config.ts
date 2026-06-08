import { defineConfig } from "react-doctor/api";

/**
 * Narrow ignores for intentional sequential async — reliability over parallelism.
 * See AGENTS.md: upload/recorder/FFmpeg paths must preserve ordering.
 */
export default defineConfig({
  ignore: {
    overrides: [
      {
        files: ["lib/hooks/use-browser-ffmpeg-export.ts"],
        rules: ["react-doctor/async-await-in-loop"],
      },
      {
        files: ["lib/uploader/s3-uploader.ts"],
        rules: ["react-doctor/async-await-in-loop"],
      },
      {
        files: ["lib/uploader/upload-chunk-queue.ts"],
        rules: ["react-doctor/async-await-in-loop"],
      },
      {
        files: ["lib/uploader/upload-worker-pool.ts"],
        rules: ["react-doctor/async-await-in-loop", "react-doctor/async-defer-await"],
      },
      {
        files: ["lib/recorder/recorder-manager.ts"],
        rules: ["react-doctor/async-await-in-loop"],
      },
    ],
  },
});
