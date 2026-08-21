# Notes for working in this repo

## Two coexisting identity systems on `/display`

The Customer Display page (`src/app/display/page.tsx` → `DisplayRoot.tsx` →
`DisplayStage.tsx`) runs two independent pairing/identity systems side by
side. They solve different problems and neither is a replacement for the
other — don't conflate them when touching either.

**1. MQTT room code (`src/core/sync/network.ts`, `SyncProvider`)** — an
ephemeral session-sync channel. A fresh room code is minted every time
`/display` loads (`makeRoomCode()`), put in the URL, and used to pair the
Sales Companion to this specific browser tab for the duration of one live
session. It carries no persisted identity: reload the page and you get a new
room. This is what powers the Companion controlling the Display in real
time (questions, recommendations, the proposal) and the "Continue on your
phone" QR (Module 2, `ContinueQr.tsx`) and the aiPromptTicker/continueQr
Display Studio widgets that read `useSync()`.

**2. Display device identity (`src/core/store/displayDevice.ts`, Display
Studio's `Display` model)** — a permanent kiosk identity, independent of
page reloads or which Companion happens to be paired right now. An admin
registers a `Display` row from Display Studio's Displays tab, gets a
one-time `pairingCode` (+ QR to `/display?pair=CODE`), and the kiosk
exchanges that code once for a `deviceToken` it persists in `localStorage`
(see `claimPairingCode()`). Every subsequent load sends that token on
`GET /api/displays/[id]/config`, which is both how the kiosk resolves its
assigned idle profile and the heartbeat the dashboard's online/offline
indicator is computed from (`lastSeenAt`). This is what Display Studio's
runtime seams key off — an idle profile assignment, and (forwarded through
as `deviceId`/`deviceToken` props into `DisplayProfileRenderer`) which
kiosk a `leadCapture` submission or the `continueQr` widget's session
should be attributed to.

A single physical screen normally has both: a `Display` row it claimed once
(so it stays configured across restarts) and a fresh MQTT room each time the
tab reloads (so a Companion can pair to it for that particular session).
Losing localStorage re-triggers the pairing prompt for #2 but has no effect
on #1, and vice versa — treat them as orthogonal.
