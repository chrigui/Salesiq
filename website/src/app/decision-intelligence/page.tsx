import { Sparkles, UserCheck2, LineChart } from "lucide-react";
import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/marketing/container";
import { SectionHeader } from "@/components/marketing/section-header";
import { FeatureCard } from "@/components/marketing/feature-card";
import { RevealGroup } from "@/components/marketing/reveal-group";
import { ComparisonTable } from "@/components/marketing/comparison-table";
import { FAQ } from "@/components/marketing/faq";
import { CTABand } from "@/components/marketing/cta-band";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "Decision Intelligence",
  description:
    "Decision Intelligence is the discipline of reasoning through a high-consideration purchase transparently, in real time, with the person who has to live with it.",
  path: "/decision-intelligence",
});

const PROBLEMS = [
  {
    title: "The pitch is improvised.",
    description: "Every rep relies on memory and instinct on every call. Quality varies rep to rep — and even a great rep has an off day.",
  },
  {
    title: "The reasoning is invisible.",
    description: "Buyers are told what to buy, rarely shown why. Trust rests on rapport, not evidence — which is a fragile foundation for a large purchase.",
  },
  {
    title: "The system remembers activity, not judgment.",
    description: "A CRM logs what happened. It has no opinion on what should happen next — that judgment still lives entirely in the rep's head.",
  },
];

const PROOF_POINTS = [
  {
    icon: <Sparkles className="h-5 w-5" aria-hidden="true" />,
    title: "Explainable scoring",
    description: "Every recommendation the Decision Engine produces carries the reasons behind it — visible to the buyer, not just the rep.",
  },
  {
    icon: <UserCheck2 className="h-5 w-5" aria-hidden="true" />,
    title: "AI Sales Twin",
    description: "A top performer's judgment, encoded once and available to every rep on every deal — not just the ones who shadowed them.",
  },
  {
    icon: <LineChart className="h-5 w-5" aria-hidden="true" />,
    title: "Business Impact Dashboard",
    description: "Pipeline and win-rate numbers computed from real activity, so the business can reason about performance the same way the engine reasons about a deal.",
  },
];

const COMPARISON_ROWS = [
  {
    label: "Primary function",
    values: ["Records what happened", "Distributes content to reps", "Reasons through what to do next"],
  },
  {
    label: "Where the intelligence lives",
    values: ["In the rep's head", "In a content library", "In an explainable decision engine"],
  },
  {
    label: "What the buyer sees",
    values: ["Nothing — it's internal", "A polished deck", "The reasoning behind their own recommendation"],
  },
  {
    label: "How consistency happens",
    values: ["It doesn't — reps vary", "Scripted talk tracks", "Every rep reasons from the same engine"],
  },
];

const FAQ_ITEMS = [
  {
    question: "Isn't this just AI-powered sales enablement?",
    answer:
      "Sales enablement gives reps better content to deliver. Decision Intelligence gives the buyer visible reasoning behind a recommendation, computed live from what they actually said they need — it's a different object, not a better version of the same one.",
  },
  {
    question: "Does this replace our CRM?",
    answer:
      "No. A CRM is still the system of record for accounts, contacts, and pipeline stage. SalesIQ is the reasoning layer that runs during the conversation itself — it can feed a CRM, not replace it.",
  },
  {
    question: "What happens when the AI recommendation is uncertain or wrong?",
    answer:
      "The engine is deterministic and explainable by design: it shows its scoring, not just a conclusion, so a rep or buyer can see exactly which factor drove a result and disagree with it. When an AI model isn't configured or available, SalesIQ falls back to its deterministic scoring rather than inventing an answer.",
  },
  {
    question: "Is the reasoning really shown to the buyer, or is that a marketing claim?",
    answer:
      "It's a real, live product surface — the Customer Experience Display shows the top match alongside the specific reasons it scored highest, in the room, in real time. It's part of the platform tour.",
  },
];

export default function DecisionIntelligencePage() {
  return (
    <main id="main">
      <PageHero
        eyebrow="The category"
        title="Decision Intelligence, defined."
        subtitle="Decision Intelligence is the discipline of reasoning through a high-consideration purchase transparently, in real time, with the person who has to live with the decision. It's not CRM, and it's not sales enablement — it's the layer neither of them ever built."
        secondaryLabel="See the platform"
        secondaryHref="/platform"
      />

      <section className="border-b border-line py-20">
        <Container>
          <SectionHeader
            eyebrow="The problem"
            title="Enterprise buying runs on memory, rapport, and a system that only looks backward."
            subtitle="None of this is a rep problem. It's an infrastructure gap — nothing in the stack was built to reason through a decision while it's happening."
          />
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {PROBLEMS.map((p) => (
              <div key={p.title}>
                <h3 className="text-lg text-ink">{p.title}</h3>
                <p className="mt-3 text-[14.5px] leading-relaxed text-ink-muted">{p.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-b border-line py-20">
        <Container>
          <SectionHeader
            eyebrow="Why a new category"
            title="CRM. Sales enablement. Decision Intelligence."
            subtitle="Each of the first two solves a real problem. Neither reasons through the decision itself, with the buyer, while it's being made."
          />
          <div className="mt-12">
            <ComparisonTable columns={["CRM", "Sales enablement", "Decision Intelligence"]} rows={COMPARISON_ROWS} highlightColumn={2} />
          </div>
        </Container>
      </section>

      <section className="border-b border-line py-20">
        <Container>
          <SectionHeader
            eyebrow="Not a thesis — a product"
            title="Three mechanics that make this real, not aspirational."
            subtitle="Decision Intelligence is a claim any vendor can make. Here's what backs it in SalesIQ specifically, today."
          />
          <RevealGroup className="mt-12 grid gap-5 sm:grid-cols-3">
            {PROOF_POINTS.map((p) => (
              <FeatureCard key={p.title} icon={p.icon} title={p.title} description={p.description} live />
            ))}
          </RevealGroup>
        </Container>
      </section>

      <section className="py-20">
        <Container className="max-w-wide">
          <SectionHeader eyebrow="Questions" title="Where people usually push back" align="left" />
          <div className="mt-10 max-w-read">
            <FAQ items={FAQ_ITEMS} />
          </div>
        </Container>
      </section>

      <Container className="pb-24">
        <CTABand
          title="See the reasoning layer, not the pitch deck."
          subtitle="A working walkthrough of the Decision Engine against your own use case."
        />
      </Container>
    </main>
  );
}
