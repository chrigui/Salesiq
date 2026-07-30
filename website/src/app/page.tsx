import Link from "next/link";
import { Compass, Sparkles, UserCheck2, LineChart, MessageSquareText, ScreenShare, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/marketing/container";
import { SectionHeader } from "@/components/marketing/section-header";
import { FeatureCard } from "@/components/marketing/feature-card";
import { RevealGroup } from "@/components/marketing/reveal-group";
import { StatCounter } from "@/components/marketing/stat-counter";
import { LogoStrip } from "@/components/marketing/logo-strip";
import { CTABand } from "@/components/marketing/cta-band";
import { DottedBackground } from "@/components/marketing/dotted-background";
import { DecisionEnginePreview } from "@/components/marketing/decision-engine-preview";
import { IllustrativeNote } from "@/components/marketing/illustrative-note";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "Enterprise AI Decision Intelligence",
  description:
    "SalesIQ is the Decision Intelligence platform for enterprise sales teams: guided selling, explainable AI, and a decision engine that shows its work on every recommendation.",
  path: "/",
});

const VALUE_PROPS = [
  {
    icon: <Compass className="h-5 w-5" aria-hidden="true" />,
    title: "Guided Selling",
    description: "Every conversation follows a structured path, calibrated to what this buyer actually needs — not a generic script.",
  },
  {
    icon: <Sparkles className="h-5 w-5" aria-hidden="true" />,
    title: "Explainable AI",
    description: "Every recommendation shows its reasoning. Buyers see why, not just what — and decide with confidence instead of pressure.",
  },
  {
    icon: <UserCheck2 className="h-5 w-5" aria-hidden="true" />,
    title: "AI Sales Twin",
    description: "Encode your best rep's judgment once. Every rep, on every deal, works from that same standard.",
  },
  {
    icon: <LineChart className="h-5 w-5" aria-hidden="true" />,
    title: "Business Impact Dashboard",
    description: "Pipeline, win rate, and deal velocity — computed from real activity, not a vanity metric wall.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: MessageSquareText,
    title: "Meet the buyer",
    description: "A guided flow on the rep's phone asks what this specific buyer needs — budget, timeline, must-haves.",
  },
  {
    step: "02",
    icon: ScreenShare,
    title: "Reason through it together",
    description: "The Decision Engine scores the real inventory live, on the shared screen, and explains every result.",
  },
  {
    step: "03",
    icon: ClipboardCheck,
    title: "Follow through with evidence",
    description: "A proposal, a dashboard, and a record of why — so the deal closes on reasoning, not memory.",
  },
];

export default function HomePage() {
  return (
    <main id="main">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line">
        <DottedBackground />
        <Container className="relative pb-20 pt-24 sm:pt-32">
          <p className="eyebrow text-accent-ink">Introducing Decision Intelligence</p>
          <h1 className="mt-6 max-w-3xl text-[clamp(2.6rem,6.5vw,4.6rem)] leading-[1.02] text-ink">
            Enterprise buying is broken. We built the category that fixes it.
          </h1>
          <p className="mt-7 max-w-read text-[18px] leading-relaxed text-ink-muted">
            SalesIQ turns every sales conversation into a reasoned, evidence-backed decision —
            guiding the buyer, explaining the recommendation, and giving your whole team the
            judgment of your best rep, on every deal.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href="/demo">Book a demo</Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/platform">See the platform</Link>
            </Button>
          </div>

          <div className="mt-16">
            <DecisionEnginePreview />
          </div>
        </Container>
      </section>

      {/* Value proposition */}
      <section className="border-b border-line py-20">
        <Container>
          <SectionHeader
            eyebrow="Why Decision Intelligence"
            title="CRM tells you what happened. SalesIQ reasons through what to do next."
            subtitle="Sales enablement gives reps content. Decision Intelligence gives them judgment — structured, explainable, and consistent across every rep and every deal."
          />
          <RevealGroup className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {VALUE_PROPS.map((v) => (
              <FeatureCard key={v.title} icon={v.icon} title={v.title} description={v.description} live />
            ))}
          </RevealGroup>
        </Container>
      </section>

      {/* Stats + logos */}
      <section className="border-b border-line py-20">
        <Container>
          <div className="grid gap-10 sm:grid-cols-3">
            <StatCounter value={38} suffix="%" label="Faster time-to-recommendation vs. an unguided sales conversation" />
            <StatCounter value={2.4} decimals={1} suffix="×" label="More deals reach a proposal when reasoning is shown, not just asserted" />
            <StatCounter value={91} suffix="%" label="Of buyers say an explained recommendation increased their confidence" />
          </div>
          <IllustrativeNote className="mt-6 justify-center text-center">
            Representative pilot outcomes — illustrative until published case studies are available.
          </IllustrativeNote>
          <div className="mt-16 border-t border-line pt-12">
            <p className="eyebrow mb-8 text-center text-ink-muted">Built for teams selling considered purchases</p>
            <LogoStrip />
          </div>
        </Container>
      </section>

      {/* How it works */}
      <section className="py-20">
        <Container>
          <SectionHeader
            eyebrow="How it works"
            title="Three surfaces. One decision engine."
            subtitle="A phone for the rep, a screen for the buyer, a dashboard for the business — all reasoning from the same explainable engine."
          />
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {HOW_IT_WORKS.map((h) => (
              <div key={h.step} className="flex flex-col gap-3">
                <span className="relative grid h-11 w-11 place-items-center rounded-full bg-ink text-paper">
                  <h.icon className="h-4.5 w-4.5" aria-hidden="true" />
                  <span className="absolute -bottom-1.5 -right-1.5 grid h-5 w-5 place-items-center rounded-full bg-accent-ink font-mono text-[9px] text-white">
                    {h.step}
                  </span>
                </span>
                <h3 className="text-lg text-ink">{h.title}</h3>
                <p className="text-[14.5px] leading-relaxed text-ink-muted">{h.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <Container className="pb-24">
        <CTABand
          title="See how your team would sell with a Decision Engine behind every conversation."
          subtitle="A 30-minute walkthrough with your own use case — no generic demo script."
          secondaryLabel="Explore the platform"
          secondaryHref="/platform"
        />
      </Container>
    </main>
  );
}
