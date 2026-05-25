# Plan 04: Transcript Pipeline (Whisper)

**Status:** done (Creator Suite batch 3 — re-queue on upload, worker DB fallback, session review polling)  
**Priority:** P1

## Problem

Recordings have no searchable text. Users cannot find specific moments, generate show notes, or do text-based editing without a transcript.

## Solution

After a recording session is marked COMPLETED, queue a transcription job. A BullMQ worker processes the audio, calls the Whisper API, and stores word-level timestamped segments in a `TranscriptSegment` table. The client polls for completion.

After transcript is stored, queue an LLM job for chapters + show notes (Plan 06).

## Database

```prisma
model TranscriptSegment {
  id         String   @id @default(cuid())
  sessionId  String
  userId     String?
  startTime  Float
  endTime    Float
  text       String
  confidence Float?
  session    RecordingSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  @@index([sessionId, startTime])
}
```

## Architecture

```
session COMPLETED → queue job → BullMQ worker → Whisper API
                                           ↓
                              store TranscriptSegment rows
                                           ↓
                              queue LLM job (chapters + notes)
```

## New Packages

- `packages/jobs` — BullMQ queue definitions, job types

## New App

- `apps/worker` — BullMQ processor (separate Bun process)

## Acceptance Criteria

- Transcript generated within 60s of session completing
- Word-level timestamps accurate to ±0.5s
- Transcript displayed on session review page with timestamps
- Transcript stored in DB for future queries
