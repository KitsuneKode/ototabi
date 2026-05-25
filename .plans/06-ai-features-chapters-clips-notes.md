# Plan 06: AI Features — Chapters, Clips, Show Notes

**Status:** in-progress — Creator Suite pipeline (chapters, clips, show notes); regen/polish TBD  
**Priority:** P2

## Problem

After recording, creators spend hours on post-production: writing show notes, finding timestamps for chapters, hunting for clip-worthy moments, editing out filler words. All manual, all tedious.

## Solution

After the transcript pipeline completes (Plan 04), run a chain of LLM jobs:

### Auto Chapters

Send transcript to LLM → "Identify topic boundaries and suggest chapter titles." → store `Chapter` rows.

### Auto Show Notes

Same LLM call → summary, key topics, timestamps, 3 SEO title suggestions → store `ShowNotes`.

### AI Clip Detection

Analyze transcript + audio energy → detect highlights: laughter, emphasis, speaker changes, energy spikes. Mark segments for clip generation. User selects format (vertical/horizontal/square).

### Filler Word Removal

LLM identifies "um", "uh", "like", "you know" in transcript → timestamp ranges → offer "remove all" button.

### Noise Reduction

FFmpeg.wasm `afftdn` filter. Toggle in export tab. No server processing needed.

### Subtitle Burn-in

Transcript → SRT format → FFmpeg `subtitles` filter → burn into video.

## Database

```prisma
model Chapter {
  id        String   @id @default(cuid())
  sessionId String
  title     String
  startTime Float
  endTime   Float?
  session   RecordingSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
}

model ShowNotes {
  id        String   @id @default(cuid())
  sessionId String   @unique
  summary   String   @db.Text
  keywords  Json
  seoTitles Json
  session   RecordingSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
}

model Clip {
  id        String   @id @default(cuid())
  sessionId String
  title     String?
  startTime Float
  endTime   Float
  format    String   @default("vertical")
  s3Key     String?
  session   RecordingSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
}
```

## Files to Create

- Migrations for `Chapter`, `ShowNotes`, `Clip`

## Files to Change

- `apps/worker` — LLM job handlers
- `apps/client/app/export/[sessionId]/page.tsx` — chapters panel, clip selector, noise reduction toggle, filler word UI

## Acceptance Criteria

- Chapters auto-generated within 30s of transcript completion
- Show notes include summary + 3 SEO titles
- Clip detection identifies 5-10 highlight segments per hour
- Noise reduction is a one-click toggle in export
- Filler word removal shows count + preview before applying
