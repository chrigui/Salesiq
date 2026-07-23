# SalesIQ — Decision Intelligence Platform

An **industry-agnostic** SaaS platform that guides customers through complex
purchasing decisions using interactive presentations, an AI decision engine,
and visual storytelling. Real estate, automotive, private jets, medical
equipment, insurance, education — the same platform, reconfigured per industry.

> The customer sees a beautiful presentation. The salesperson guides from their
> phone. The AI explains **why**.

This repository is a **runnable vertical slice** of that vision — a real,
buildable Next.js application that proves the concept end to end, architected so
the remaining surface area (visual builders, native mobile, billing, SSO) plugs
into the same core.

---

## The five products

| Product | Route | What it is |
| --- | --- | --- |
| **Customer Experience Display** | `/display` | The full-screen, animated presentation the customer sees. Keynote-grade motion, glassmorphism, live-driven. Never looks like a dashboard. |
| **Sales Companion** | `/companion` | The phone the salesperson holds. Asks questions, jumps sections, bookmarks, generates a proposal — every action updates the display instantly. |
| **Company Dashboard** | `/dashboard` | Each tenant's admin: inventory, questions, branding, leads and analytics (conversion, funnel, most-selected, completion rates). |
| **Platform Administration** | `/admin` | Our master console: tenants, subscriptions, MRR/ARR, churn, usage by vertical, system health. |
| **AI Decision Engine** | `/api/ai/recommend`, `/api/ai/search` | Scores inventory against answers and returns **self-explaining** recommendations. Also turns a plain-language customer description into structured answers. Runs offline; upgrades to live Claude by setting `ANTHROPIC_API_KEY`. |

### See the two-screen magic

Open **`/display`** and **`/companion`** in two browser windows side by side.
Drive the companion — the display reacts in real time. They stay in lockstep via
a `BroadcastChannel` sync bus (the same seam becomes a WebSocket in production).

---

## Why it's not "just a real-estate app"

Everything industry-specific lives in an **industry pack** — a single config
object describing questions, inventory, scoring rules and branding. The engine
and every UI surface are entirely pack-driven.

Three packs ship in `src/core/industries/`:

- `real-estate.ts` — Green Hills Living
- `automotive.ts` — Vantage Motors
- `private-jets.ts` — Meridian Aviation

Switch between them live from the Sales Companion. The whole UI re-skins
(brand colours are CSS variables applied per tenant) and the questions,
inventory and AI reasoning all change with it. Adding a new vertical (yachts,
medical equipment, insurance…) is a new config file — no engine changes.

---

## The AI Decision Engine

The platform's core promise: **a recommendation always explains itself.**

```
Based on your answers, Green Hills is an excellent match — it is within budget
at $285,000, it also offers 4 bedrooms meeting your need for 4, plus it has
international schools within 5 minutes, and it comes with a private garden.
It has also shown 18% appreciation over the last three years.
```

- **`scoring.ts`** — weights every answer against every inventory item, handles
  conditional questions, and normalises partial sessions. Produces a score *and*
  a set of verified reasons.
- **`explain.ts`** — turns the verified reasons into a natural-language
  narrative. Deterministic and offline by default (instant, zero cost, never
  hallucinates). `buildNarrationPrompt` is the exact prompt a tenant would send
  to Claude for richer prose — the scoring/ranking stay identical, so the model
  can only ever rephrase *verified* facts.

The LLM path is **live and key-gated**: set `ANTHROPIC_API_KEY` and the top
recommendation's narrative is authored by Claude (`claude-opus-4-8`) from the
engine's own verified reasons. With no key — or on any API error — it falls
back to the deterministic narrator automatically. The UI is identical either
way.

### Natural-language search

The Sales Companion has a **"Describe the customer"** box. Type a plain
sentence — *"Family of 5, budget around 300k, needs schools and a garden, four
bedrooms"* — and `/api/ai/search` turns it into structured answers that drive
the exact same decision engine, then jumps the display to the recommendation.

- With `ANTHROPIC_API_KEY` set, Claude extracts the answers against the active
  pack's own questions (works for any vertical — automotive, jets, medical).
- Without a key, a deterministic keyword extractor handles it (budget figures,
  household, bedroom counts, must-haves, negations) so the feature always works
  in a demo with zero configuration.

Either way every extracted value is coerced and validated against the pack, so
a bad extraction can never inject a value the engine doesn't understand.

---

## Tech stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript** (strict)
- **Tailwind CSS** with runtime CSS-variable theming for multi-tenant branding
- **Framer Motion** for the presentation-grade transitions
- **Zustand** for session state, synced across surfaces
- **Recharts** for the dashboards

No backend or API key required to run — the engine and sync work fully client-side.

---

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
```

```bash
npm run build        # production build
npm run start        # serve the production build
npm run typecheck    # tsc --noEmit
```

Then open `/companion` and `/display` in two windows.

---

## Deploy to Vercel

This is a stock Next.js 15 app with **no environment variables and no API keys**
required, so it deploys with zero configuration.

1. Go to [vercel.com/new](https://vercel.com/new) and **Import** the
   `chrigui/salesiq` repository (authorize Vercel's GitHub app for the repo if
   prompted — it is private).
2. Vercel auto-detects **Next.js** (Build: `next build`, Install: `npm install`,
   Output: default). Leave everything as-is.
3. Under **Git branch**, pick the branch you want to deploy
   (e.g. `claude/decision-intelligence-platform-0miwwv`), or merge it to `main`
   first and deploy that.
4. Click **Deploy**. You get a live `https://<project>.vercel.app` URL.

Every later push to the connected branch redeploys automatically; pushes to
non-production branches get their own preview URLs.

---

## Cross-device pairing (phone → laptop)

The two surfaces stay in lockstep two ways:

- **Same browser** (two tabs on one machine) → instant, offline, via
  `BroadcastChannel`.
- **Different devices** (salesperson's phone drives the customer's laptop/TV) →
  over a realtime relay. Open **`/display`**: it shows a **QR code + short
  code**. Scan it with a phone (or open `/companion` and type the code) and the
  phone controls the display in real time. State is published `retain`-ed so a
  screen that joins late hydrates to the current session immediately.

The relay is **MQTT-over-WebSocket**, chosen because it needs no backend (Vercel
can't host persistent WebSockets). By default it uses a **public broker** —
great for demos, but anyone who guesses your room code could observe the
(non-sensitive) session data. For production, point it at a private/managed
broker (HiveMQ Cloud, EMQX Cloud, self-hosted Mosquitto, …):

```bash
# .env.local  (or Vercel project env vars)
NEXT_PUBLIC_SYNC_BROKER=wss://your-broker.example.com:8084/mqtt
NEXT_PUBLIC_SYNC_PREFIX=yourcompany         # optional topic namespace
```

Same-device sync needs no configuration at all.

---

## Map (MapLibre GL, real 3D)

The Interactive Lifestyle Map renders on real **OpenStreetMap** data via
[MapLibre GL](https://maplibre.org/). By default it uses CARTO's free, key-less
vector styles (dark-matter / positron), so the day/night toggle swaps real
styles, with the required `© OpenStreetMap © CARTO` attribution shown on-map.
No API key needed.

- **True 3D** — the 2D/3D control pitches the camera and the map extrudes
  **3D buildings** from the vector tiles. The lifestyle radius and walking
  routes are real map layers, so they sit in correct perspective on the ground;
  pins and cards are projected with `map.project()` and stay upright.
- **Walking routes** — animated "ant-path" lines from the home to the walkable
  amenities (schools, parks).
- **Cinematic camera** — flies in on arrival and between districts when the
  recommendation changes.

Override the styles with env vars — e.g. OpenFreeMap (also free, no key) or a
managed provider (MapTiler, etc.):

```bash
NEXT_PUBLIC_MAP_STYLE_DARK=https://tiles.openfreemap.org/styles/liberty
NEXT_PUBLIC_MAP_STYLE_LIGHT=https://tiles.openfreemap.org/styles/positron
```

---

## Architecture

```
src/
├── app/                      # routes: /, /display, /companion, /dashboard, /admin, /api
├── core/
│   ├── types.ts              # industry-agnostic domain model
│   ├── industries/           # industry packs (config = questions + inventory + rules + brand)
│   ├── engine/               # scoring.ts (decision logic) + explain.ts (AI narrative)
│   ├── sync/                 # session-bus.ts (BroadcastChannel) + network.ts (MQTT/WS pairing)
│   └── store/                # Zustand session store, synced
├── components/
│   ├── display/              # the customer presentation
│   ├── companion/            # the salesperson controller + proposal generator
│   ├── console/              # shared dashboard chrome
│   ├── providers/            # sync + brand theming
│   └── ui/                   # glass primitives
└── lib/                      # icon resolver, mock analytics
```

## Scope & roadmap

This slice implements the core loop (configure → question → score → explain →
present → propose) across all five surfaces. The full product vision layers on:
drag-and-drop visual builders (presentations, decision trees, rules), native
Android/iOS companion apps with offline sync, per-tenant custom domains, SSO /
OAuth / RBAC, billing (Stripe) and CRM integrations (Salesforce, HubSpot,
WhatsApp), and predictive analytics. Each attaches to the same config-driven
core rather than replacing it.
