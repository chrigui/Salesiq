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

## Deploying to Vercel — this site owns the root domain

This repo hosts two independent Next.js apps, and this site is meant to **own the public root
domain** (`/`) — the product app's homepage moves aside in favor of it, while `/display`,
`/companion`, `/dashboard`, `/admin`, `/continue`, and `/api/*` keep working exactly as before,
transparently proxied through to the product app. This is
[Vercel's documented Multi-Zones pattern](https://vercel.com/docs/multi-zones): two separate
Vercel projects, stitched into one apparent site via `next.config.mjs` rewrites — not a code
merge, so neither app's design system or routing touches the other's.

**You'll end up with two Vercel projects from the same repo:**

| | This app (`website/`) | The product app (repo root) |
|---|---|---|
| Root Directory | `website` | *(default — repo root)* |
| Owns | `/`, `/platform`, `/decision-intelligence`, `/pricing`, `/demo` | `/display`, `/companion`, `/dashboard`, `/admin`, `/continue`, `/api/*` |
| Custom domain | Your main domain (e.g. `salesiq.ai`) | Its own Vercel-assigned domain — no custom domain needed |
| New env var | `PRODUCT_APP_URL` | `PRODUCT_APP_URL` |

### Steps

1. **If the product app isn't already a Vercel project**, import this repo as one (Root Directory
   left at its default — the repo root). Note the domain Vercel assigns it
   (`your-project.vercel.app`, or whatever you configure).
2. **Import this repo a second time** as a new project for the marketing site. Set
   **Settings → General → Root Directory** to `website`.
3. In **both** projects, add an environment variable **`PRODUCT_APP_URL`** set to the product
   app's real URL from step 1 (e.g. `https://your-project.vercel.app`, no trailing slash).
   - In the marketing project, it's used by `next.config.mjs`'s `rewrites()` to proxy
     `/display`, `/companion`, `/dashboard`, `/admin`, `/continue`, and `/api/*` through to it.
   - In the product project (root `next.config.mjs`), it's used as `assetPrefix` — so that when a
     page is reached *through* the marketing domain's proxy, its JS/CSS chunks still resolve back
     to the product app's own deployment instead of 404ing against the marketing domain.
   - Neither app breaks if this var is unset — the rewrite and the assetPrefix both no-op, which
     is exactly what local development needs (see below).
4. **Move your main custom domain** (Domains tab) from the product project to the marketing
   project. The product project can keep its Vercel-assigned domain, or get a new one — it doesn't
   need the main domain once the marketing site is proxying to it.
5. Redeploy both projects after adding the env var (`PRODUCT_APP_URL` is read at build time for
   `assetPrefix`, and `rewrites()` is also evaluated per-build).

### What this does *not* touch

Zero changes to the product app's route files, components, or design system — the only change on
that side is one `assetPrefix` line in its `next.config.mjs`. If you'd rather not do the multi-zone
proxy setup at all, this site still works standalone on its own domain/subdomain (skip steps 3–4);
you'd just lose the "one seamless domain" effect and the marketing nav's "Sign in" link
(`src/components/nav/site-nav.tsx`) would need to point at the product app's actual domain instead
of the relative `/dashboard`.

### Local development with both apps

`PRODUCT_APP_URL` isn't set locally, so running `npm run dev` here serves only this app's own 5
pages — visiting `/dashboard` (e.g. via the "Sign in" link) will 404, since there's no local proxy.
Run the product app separately (`npm run dev` from the repo root, a different port) if you need to
test both together; there's no automated local multi-zone story for this phase.

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
