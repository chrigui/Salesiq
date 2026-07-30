import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DottedBackground } from "@/components/marketing/dotted-background";

export function CTABand({
  title,
  subtitle,
  primaryLabel = "Book a demo",
  primaryHref = "/demo",
  secondaryLabel,
  secondaryHref,
}: {
  title: React.ReactNode;
  subtitle?: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-ink px-8 py-16 text-center sm:px-16">
      <DottedBackground className="opacity-30" />
      <div className="relative mx-auto max-w-read">
        <h2 className="text-[clamp(1.8rem,3.6vw,2.6rem)] leading-[1.1] text-paper">{title}</h2>
        {subtitle && <p className="mt-4 text-[15px] text-paper/70">{subtitle}</p>}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild variant="inverse" size="lg">
            <Link href={primaryHref}>{primaryLabel}</Link>
          </Button>
          {secondaryLabel && secondaryHref && (
            <Button asChild variant="secondary" size="lg" className="border-paper/25 text-paper hover:bg-paper/10">
              <Link href={secondaryHref}>{secondaryLabel}</Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
