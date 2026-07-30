# SalesIQ — Marketing Website

The public marketing site for SalesIQ, the Enterprise AI Decision Intelligence platform. This is a
standalone Next.js 15 app, independent of the product app in the repo root (`../src`) — different
design language (warm paper, forest green, gold — ported from `docs/overview.html` and
`docs/product-bible.html`), different audience, different deploy target.

## Phase 1 scope

This is the foundation pass: the design system, the core component library, and five flagship
pages (Homepage, Platform, Decision Intelligence, Pricing, Book a Demo). The full 30-page sitemap
from the site brief is scaffolded in `src/components/nav/nav-config.ts`, tagged `live` or
`planned` — only `live` pages render in navigation. Later phases add pages by flipping a page's
status in that one file and adding its route folder; see the plan doc in this repo's Claude Code
session history for the phased roadmap.

## Local development

```bash
cd website
npm install
npm run dev
```

Runs on `http://localhost:3000` (or `next dev`'s next available port if 3000 is taken by the
product app's own dev server — the two apps are unrelated and can run side by side).

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — serve a production build
- `npm run typecheck` — `tsc --noEmit`
- `npm run lint` — `next lint`
- `npm run test:e2e` — Playwright suite (builds and serves on port 3200 automatically; no
  database or other service dependency — see `playwright.config.ts`)

## The demo request form

`POST /api/demo-request` validates and logs the submission server-side. There is no CRM or email
service (ESP) configured yet — forwarding to one (e.g. HubSpot, Resend) is a `TODO` in
`src/app/api/demo-request/route.ts`, the same disclosure pattern the product app uses for its own
not-yet-wired integrations.

## Deploying to Vercel

This repo hosts two independent Next.js apps. Deploy the website as its **own Vercel project**:

1. Import this repository into Vercel as a new project (separate from the product app's project).
2. In **Settings → General → Root Directory**, set it to `website`.
3. Vercel auto-detects Next.js from there — no other configuration is required for this phase
   (no database, no environment variables).
4. Point the project's production domain at the marketing site's intended hostname.

## Design system

Tokens live in `src/app/globals.css` as CSS custom properties (light and dark, the same
architecture as `docs/overview.html`), mirrored into `tailwind.config.ts`. The one deliberate
deviation from the source docs: headline text uses a self-hosted **Fraunces** (via `next/font`)
ahead of the original system-serif fallback chain, for consistent rendering across platforms —
see the plan's Typography section for the full reasoning. Everything else (sans body text, mono
labels, color values, radius scale, the dotted hero texture) is ported verbatim.

## Honesty in marketing copy

SalesIQ has no published enterprise customers yet. Anywhere this site shows a stat, logo, or
testimonial, it's illustrative and labeled as such via `<IllustrativeNote>`
(`src/components/marketing/illustrative-note.tsx`) — never presented as a real, audited result.
Feature claims are grounded against `docs/overview.html` / `docs/product-bible.html`'s own
live/planned status markers; anything not shipped in the product reads as roadmap, not GA.
