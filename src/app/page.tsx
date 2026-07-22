import Link from "next/link";
import {
  Monitor,
  Smartphone,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Layers,
} from "lucide-react";

const PRODUCTS = [
  {
    href: "/display",
    title: "Customer Experience Display",
    desc: "The full-screen presentation the customer sees. Keynote-grade motion, live-driven by the companion.",
    icon: Monitor,
    accent: "from-indigo-500/20 to-violet-500/10",
  },
  {
    href: "/companion",
    title: "Sales Companion",
    desc: "The phone the salesperson holds. Ask questions, jump sections, generate proposals — the display reacts instantly.",
    icon: Smartphone,
    accent: "from-emerald-500/20 to-teal-500/10",
  },
  {
    href: "/dashboard",
    title: "Company Dashboard",
    desc: "Each tenant's admin — inventory, questions, branding, leads and analytics.",
    icon: LayoutDashboard,
    accent: "from-sky-500/20 to-blue-500/10",
  },
  {
    href: "/admin",
    title: "Platform Administration",
    desc: "Our master console — tenants, subscriptions, MRR/ARR, usage and system health.",
    icon: ShieldCheck,
    accent: "from-rose-500/20 to-orange-500/10",
  },
];

export default function Home() {
  return (
    <main className="bg-aurora min-h-screen">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
        <header className="animate-fade-up">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-ink-muted">
            <Sparkles className="h-3.5 w-3.5 text-brand" />
            Decision Intelligence Platform
          </div>
          <h1 className="max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            <span className="text-gradient">SalesIQ</span> turns complex
            purchases into guided, cinematic decisions.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-ink-muted">
            One configurable platform for real estate, automotive, private jets,
            medical equipment, insurance and beyond. The customer sees a
            beautiful presentation; the salesperson guides from their phone; the
            AI explains <em>why</em>.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/companion"
              className="inline-flex items-center gap-2 rounded-2xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/30 transition hover:brightness-110"
            >
              Launch the demo <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/display"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white/10"
            >
              Open the display
            </Link>
          </div>
          <p className="mt-4 text-sm text-ink-faint">
            Tip: open <span className="text-ink-muted">/display</span> and{" "}
            <span className="text-ink-muted">/companion</span> in two windows —
            they sync live.
          </p>
        </header>

        <section className="mt-16 grid gap-5 sm:grid-cols-2">
          {PRODUCTS.map((p, i) => (
            <Link
              key={p.href}
              href={p.href}
              className="group animate-fade-up glass relative overflow-hidden rounded-3xl p-6 transition hover:-translate-y-0.5"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <div
                className={`pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br ${p.accent} blur-2xl`}
              />
              <div className="relative flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/5 ring-1 ring-white/10">
                  <p.icon className="h-6 w-6 text-brand" />
                </div>
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-semibold">
                    {p.title}
                    <ArrowRight className="h-4 w-4 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                    {p.desc}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </section>

        <section className="mt-16 grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: Layers,
              t: "Industry-agnostic core",
              d: "Questions, inventory, scoring and branding are config. Three verticals ship in the demo.",
            },
            {
              icon: Sparkles,
              t: "AI that explains itself",
              d: "Every recommendation states the reasons — within budget, near schools, proven appreciation.",
            },
            {
              icon: ShieldCheck,
              t: "Multi-tenant by design",
              d: "Own domain, branding, users, data and AI — complete isolation per organization.",
            },
          ].map((f) => (
            <div key={f.t} className="glass rounded-3xl p-5">
              <f.icon className="h-5 w-5 text-brand" />
              <h4 className="mt-3 font-semibold">{f.t}</h4>
              <p className="mt-1 text-sm text-ink-muted">{f.d}</p>
            </div>
          ))}
        </section>

        <footer className="mt-16 border-t border-white/5 pt-6 text-sm text-ink-faint">
          SalesIQ — Decision Intelligence Platform · demo build
        </footer>
      </div>
    </main>
  );
}
