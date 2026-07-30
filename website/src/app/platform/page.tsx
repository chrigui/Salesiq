import { CheckCircle2 } from "lucide-react";
import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/marketing/container";
import { CTABand } from "@/components/marketing/cta-band";
import {
  CompanionIllustration,
  DisplayIllustration,
  EngineIllustration,
  DashboardIllustration,
  AdminIllustration,
} from "@/components/marketing/surface-illustration";
import { buildMetadata } from "@/lib/metadata";
import { cn } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "Platform",
  description: "Five coordinated surfaces, one Decision Engine — a tour of how SalesIQ actually works.",
  path: "/platform",
});

const SURFACES = [
  {
    eyebrow: "Sales Companion",
    title: "The rep's device, live in the room.",
    description:
      "A guided flow on the rep's phone replaces the improvised pitch. It asks a handful of calibrated questions, feeds the Decision Engine, and drives the shared display in real time.",
    bullets: [
      "Guided Selling asks the right question, not a generic script",
      "Drives the Customer Experience Display live, in sync",
      "Sales Copilot surfaces objection-handling as the conversation happens",
    ],
    illustration: <CompanionIllustration />,
  },
  {
    eyebrow: "Customer Experience Display",
    title: "What the buyer sees, together with the rep.",
    description:
      "The recommendation appears on a shared screen — with its reasoning attached, not just a result. The buyer sees why, in real time, not a rehearsed close.",
    bullets: [
      "Explainable AI: every match shown with its reasons",
      "Compare view for weighing alternatives side by side",
      "AI Meeting Replay for revisiting exactly what was shown and said",
    ],
    illustration: <DisplayIllustration />,
  },
  {
    eyebrow: "Decision Engine",
    title: "The reasoning layer under every match.",
    description:
      "Deterministic, explainable scoring — AI-augmented when an API key is configured, with a deterministic offline fallback so a recommendation is never fabricated when the model is unavailable.",
    bullets: [
      "The same engine reasons across every industry pack",
      "Every score traces back to a stated reason, not a black box",
      "Powers the Decision Simulator and Deal Probability Radar",
    ],
    illustration: <EngineIllustration />,
  },
  {
    eyebrow: "Company Dashboard",
    title: "Pipeline, reasoned — not just reported.",
    description:
      "Business Impact Dashboard computes pipeline, win rate, and deal velocity from real activity. AI Sales Twin and Buying Committee Intelligence turn that activity into judgment your whole team can use.",
    bullets: [
      "Business Impact Dashboard: real numbers, not a vanity metric wall",
      "AI Sales Twin: your best rep's judgment, available to every rep",
      "Buying Committee Intelligence: every real stakeholder, tracked",
    ],
    illustration: <DashboardIllustration />,
  },
  {
    eyebrow: "Platform Administration",
    title: "How the operator configures and governs it.",
    description:
      "Industry Builder and Smart Wizard configure a new vertical without custom code. Role-based permissions, branches, and the audit trail keep the whole deployment governed.",
    bullets: [
      "Industry Builder + Smart Wizard for new verticals",
      "Role-based permissions across every branch",
      "Marketplace and a public API for extending the platform",
    ],
    illustration: <AdminIllustration />,
  },
];

export default function PlatformPage() {
  return (
    <main id="main">
      <PageHero
        eyebrow="Platform"
        title="Five surfaces. One Decision Engine."
        subtitle="SalesIQ isn't a single app — it's a coordinated system: a device for the rep, a screen for the buyer, an engine that reasons, a dashboard for the business, and an admin layer to govern all of it."
        secondaryLabel="See pricing"
        secondaryHref="/pricing"
      />

      <Container className="flex flex-col gap-24 py-24">
        {SURFACES.map((s, i) => (
          <div
            key={s.eyebrow}
            className={cn(
              "grid items-center gap-10 lg:grid-cols-2 lg:gap-16",
              i % 2 === 1 && "lg:[&>*:first-child]:order-2",
            )}
          >
            <div>{s.illustration}</div>
            <div className="max-w-read">
              <p className="eyebrow text-accent-ink">{s.eyebrow}</p>
              <h2 className="mt-4 text-[clamp(1.7rem,3vw,2.2rem)] leading-[1.1] text-ink">{s.title}</h2>
              <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">{s.description}</p>
              <ul className="mt-6 flex flex-col gap-2.5">
                {s.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-[14px] text-ink-muted">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent-ink" aria-hidden="true" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </Container>

      <Container className="pb-24">
        <CTABand
          title="Walk through the platform with your own use case."
          subtitle="We'll show every surface, live, against a scenario from your business."
          secondaryLabel="See how it works"
          secondaryHref="/decision-intelligence"
        />
      </Container>
    </main>
  );
}
