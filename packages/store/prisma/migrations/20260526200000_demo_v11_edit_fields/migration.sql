-- Demo v1.1 editor fields: playback speed, background blur, PiP toggle
ALTER TABLE "demo_session_data" ADD COLUMN "playbackSpeed" DOUBLE PRECISION NOT NULL DEFAULT 1;
ALTER TABLE "demo_session_data" ADD COLUMN "backgroundBlur" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "demo_session_data" ADD COLUMN "pipEnabled" BOOLEAN NOT NULL DEFAULT true;
