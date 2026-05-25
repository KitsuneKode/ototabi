# Studio trust — local smoke

Riverside parity **Wave 1 Stream 2** (Plan 13 Phase 2). Verifies preflight, consent, co-host policy, and host controls v1.

## Prerequisites

| Check        | Detail                                                                  |
| ------------ | ----------------------------------------------------------------------- |
| Infra        | Postgres, Redis, MinIO — see [try-local-smoke.md](./try-local-smoke.md) |
| Migration    | `bun run db:migrate` (adds `room_participant.recordingConsentedAt`)     |
| Two browsers | Host + guest accounts (or incognito guest)                              |
| Room         | Host creates room; optional **Studio Gate** lock on room settings       |

## 1. Preflight

1. Host opens room join: `/rooms/{code}/join` → configure devices → **Connect Studio Deck**.
2. URL should land on `/chat/{code}/preflight?...` with readiness findings (ok / warn / block).
3. **Warn path:** disable camera in join, continue — preflight shows `no_camera` or `camera_denied` as **warn**, **Enter studio** still enabled.
4. **Block path (optional):** use HTTP (non-localhost) or deny mic when audio enabled — **Enter studio** disabled until fixed.
5. Click **Enter studio** → `/chat/{code}?preflight=done&...` and studio connects.

## 2. Recording consent

1. Host enters studio (preflight done).
2. Host clicks **Start Recording** → consent modal appears if first time in room.
3. Accept consent → recording starts; header shows **REC** timer for host.
4. Guest browser: on host record start, guest sees **REC** and consent modal if not yet acknowledged.
5. Guest must accept before local MediaRecorder arms (check upload queue only after consent).
6. Decline consent → host record may run server session but guest local capture does not start until accepted.

**API check:** `rooms.acknowledgeRecordingConsent` then `rooms.getStudioContext` → `hasRecordingConsent: true`.

## 3. Co-host policy

1. Room creator invites member with role **host** (email invite from room settings).
2. Co-host signs in, joins studio via invite.
3. Co-host can **Admit** / **Deny** on locked room (settings → Studio Gate) — same as creator.
4. Co-host sees **CO-HOST** badge and **Start Recording** / pause / stop when `canControlStudio` is true.
5. Editor member cannot admit or start recording (policy tests enforce).

## 4. Host controls v1

1. With guest connected, host/co-host opens sidebar roster.
2. **Mute req** on guest → guest mic mutes (LiveKit data `mute_request`).
3. **Remove** on guest → participant row removed server-side (`rooms.removeGuest`).
4. **REC** indicator visible to all participants while session is recording (not host-only).

## 6. Session health panel

1. Host and guest in studio (`preflight=done`).
2. Open sidebar → **Health** tab (default).
3. Each connected participant shows:
   - **Link** — LIVE / SYNC / LOST for local; connected for remotes in room
   - **Upload** — idle until `upload_progress` data messages; then uploading / complete
   - **Consent** — pending while recording until `rooms.acknowledgeRecordingConsent`; then Consented
   - **Recovery** — local row shows **OPFS recovery** when IndexedDB `uploadSessions` has pending tracks (simulate by interrupting upload mid-session)
4. Local row **device** line reflects mic/cam from join URL (`micId` / `camId` labels when enumerated).
5. Switch to **Uploads** tab — existing queue UI unchanged.

**API check:** `rooms.getStudioHealth` returns `participants[]` with `hasRecordingConsent` per room participant.

## 5. Automated tests

```bash
bun fmt && bun lint && bun typecheck && bun run test
```

| Package | Tests                                                                  |
| ------- | ---------------------------------------------------------------------- |
| client  | `apps/client/lib/studio/readiness.test.ts`                             |
| trpc    | `packages/trpc/src/modules/rooms/rooms.policy.test.ts`                 |
| trpc    | `packages/trpc/src/modules/rooms/studio-health.mapper.test.ts`         |
| trpc    | `packages/trpc/src/modules/rooms/enter-studio.test.ts` (no regression) |

## Sign-off

- [ ] Preflight warn + block paths behave as above
- [ ] Consent blocks local capture until ack; persisted per participant
- [ ] Co-host admit + record controls work
- [ ] Mute request + remove guest + REC for all
- [ ] Health tab shows per-participant link, upload, consent, recovery, devices
- [ ] `bun run check` green on integration branch
