import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/marketing/container";
import { PricingCard } from "@/components/marketing/pricing-card";
import { SectionHeader } from "@/components/marketing/section-header";
import { FAQ } from "@/components/marketing/faq";
import { CTABand } from "@/components/marketing/cta-band";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "Pricing",
  description: "Enterprise pricing, scoped to your rollout — not a public list price that means nothing at this scale.",
  path: "/pricing",
});

const TIERS = [
  {
    name: "Pilot",
    description: "Prove the model with one branch and one industry pack before a company-wide rollout.",
    features: [
      "One branch, one industry pack",
      "Up to 5 seats",
      "Guided Selling, Decision Engine, Customer Experience Display",
      "Business Impact Dashboard",
      "Structured review at 30, 60, and 90 days",
    ],
    ctaLabel: "Start a pilot",
    ctaHref: "/demo",
  },
  {
    name: "Enterprise",
    description: "The full platform across every branch, with the governance a real deployment needs.",
    features: [
      "Unlimited branches and seats",
      "Every industry pack, plus new verticals via Industry Builder",
      "AI Sales Twin, Buying Committee Intelligence, Sales Copilot",
      "Role-based permissions and a full audit trail",
      "Dedicated onboarding and a named point of contact",
    ],
    ctaLabel: "Talk to sales",
    ctaHref: "/demo",
    featured: true,
  },
  {
    name: "Enterprise+",
    description: "For organizations with custom compliance, integration, or multi-brand requirements.",
    features: [
      "Everything in Enterprise",
      "Custom integrations via the public API",
      "Dedicated security review and data-handling terms",
      "Multi-brand and multi-region deployment support",
      "Quarterly business reviews with your account team",
    ],
    ctaLabel: "Talk to sales",
    ctaHref: "/demo",
  },
];

const FAQ_ITEMS = [
  {
    question: "Why don't you publish prices?",
    answer:
      "Enterprise deployments vary too much in seats, branches, and integration scope for one list price to mean anything. We scope pricing to your rollout in the first conversation, not after months of back-and-forth.",
  },
  {
    question: "How long does a typical pilot run?",
    answer:
      "Most pilots run 60 to 90 days, structured around a small number of real deals rather than a synthetic demo — the goal is a real answer on real pipeline, not a proof of concept in the abstract.",
  },
  {
    question: "Can we start with one industry pack and add more later?",
    answer:
      "Yes. Packs are additive, and Industry Builder lets you configure your own vertical without custom code once you're ready to expand.",
  },
  {
    question: "Is there a minimum contract length?",
    answer:
      "Pilots are month-to-month by design. Enterprise agreement terms are scoped in the same conversation as pricing, based on your rollout plan.",
  },
];

export default function PricingPage() {
  return (
    <main id="main">
      <PageHero
        eyebrow="Pricing"
        title="Enterprise pricing, plainly scoped."
        subtitle="We don't publish a per-seat list price — at this scale, it wouldn't mean much. Pricing is scoped to your branches, seats, and industry packs in the first conversation, not buried behind a sales call after months of self-serve guessing."
        primaryLabel="Talk to sales"
        primaryHref="/demo"
        secondaryLabel="See the platform"
        secondaryHref="/platform"
      />

      <Container className="py-20">
        <div className="grid gap-6 lg:grid-cols-3">
          {TIERS.map((tier) => (
            <PricingCard key={tier.name} {...tier} />
          ))}
        </div>
      </Container>

      <section className="border-t border-line py-20">
        <Container className="max-w-wide">
          <SectionHeader eyebrow="Questions" title="How pricing actually works" />
          <div className="mt-10 max-w-read">
            <FAQ items={FAQ_ITEMS} />
          </div>
        </Container>
      </section>

      <Container className="pb-24">
        <CTABand
          title="Tell us your rollout — we'll scope pricing around it."
          subtitle="No generic quote. A number based on your branches, seats, and industry pack."
        />
      </Container>
    </main>
  );
}
