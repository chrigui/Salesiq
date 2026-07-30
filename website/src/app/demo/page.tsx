import { CalendarClock, MessagesSquare, Sparkles } from "lucide-react";
import { Container } from "@/components/marketing/container";
import { Card } from "@/components/ui/card";
import { DottedBackground } from "@/components/marketing/dotted-background";
import { DemoRequestForm } from "@/components/forms/demo-request-form";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "Book a demo",
  description: "See SalesIQ against your own use case — a working walkthrough, not a generic demo script.",
  path: "/demo",
});

const NEXT_STEPS = [
  {
    icon: MessagesSquare,
    title: "We reply within one business day",
    description: "A real person on our team, not an automated sequence.",
  },
  {
    icon: Sparkles,
    title: "We scope the walkthrough to your use case",
    description: "Your industry, your scale — not a generic script.",
  },
  {
    icon: CalendarClock,
    title: "A 30-minute working session",
    description: "Live in the platform, against a scenario from your business.",
  },
];

export default function DemoPage() {
  return (
    <main id="main" className="relative overflow-hidden border-b border-line">
      <DottedBackground />
      <Container className="relative grid gap-16 py-20 sm:py-28 lg:grid-cols-[1fr,1.1fr] lg:gap-12">
        <div>
          <p className="eyebrow text-accent-ink">Book a demo</p>
          <h1 className="mt-5 text-[clamp(2.2rem,4.5vw,3.2rem)] leading-[1.05] text-ink">
            See SalesIQ against your own use case.
          </h1>
          <p className="mt-6 max-w-md text-[16px] leading-relaxed text-ink-muted">
            Tell us a little about your team. We&rsquo;ll reply with a working walkthrough of the platform —
            not a generic demo script.
          </p>

          <div className="mt-12 flex flex-col gap-6">
            {NEXT_STEPS.map((step) => (
              <div key={step.title} className="flex items-start gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent-wash text-accent-ink">
                  <step.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-[15px] font-medium text-ink">{step.title}</h2>
                  <p className="mt-1 text-[13.5px] text-ink-muted">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Card className="h-fit p-6 sm:p-8">
          <DemoRequestForm />
        </Card>
      </Container>
    </main>
  );
}
