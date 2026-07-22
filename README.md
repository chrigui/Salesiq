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
| **AI Decision Engine** | `/api/ai/recommend` | Scores inventory against answers and returns **self-explaining** recommendations. Runs offline; upgrades to the Claude API without changing callers. |

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

Enable the LLM path by setting `ANTHROPIC_API_KEY` and flipping `useLLM` in
`src/app/api/ai/recommend/route.ts`.

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

## Architecture

```
src/
├── app/                      # routes: /, /display, /companion, /dashboard, /admin, /api
├── core/
│   ├── types.ts              # industry-agnostic domain model
│   ├── industries/           # industry packs (config = questions + inventory + rules + brand)
│   ├── engine/               # scoring.ts (decision logic) + explain.ts (AI narrative)
│   ├── sync/                 # cross-surface session bus (BroadcastChannel → WebSocket)
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
