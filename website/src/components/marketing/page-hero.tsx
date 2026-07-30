import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DottedBackground } from "@/components/marketing/dotted-background";
import { cn } from "@/lib/utils";

export function PageHero({
  eyebrow,
  title,
  subtitle,
  primaryLabel = "Book a demo",
  primaryHref = "/demo",
  secondaryLabel,
  secondaryHref,
  className,
}: {
  eyebrow: string;
  title: React.ReactNode;
  subtitle: React.ReactNode;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  className?: string;
}) {
  return (
    <section className={cn("relative overflow-hidden border-b border-line pb-16 pt-20 sm:pt-28", className)}>
      <DottedBackground />
      <div className="relative mx-auto max-w-wide px-6">
        <p className="eyebrow text-accent-ink">{eyebrow}</p>
        <h1 className="mt-5 max-w-3xl text-[clamp(2.4rem,6vw,4.2rem)] leading-[1.03] text-ink">{title}</h1>
        <p className="mt-6 max-w-read text-[17px] leading-relaxed text-ink-muted">{subtitle}</p>
        <div className="mt-9 flex flex-wrap items-center gap-3">
          <Button asChild size="lg">
            <Link href={primaryHref}>{primaryLabel}</Link>
          </Button>
          {secondaryLabel && secondaryHref && (
            <Button asChild variant="secondary" size="lg">
              <Link href={secondaryHref}>{secondaryLabel}</Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
