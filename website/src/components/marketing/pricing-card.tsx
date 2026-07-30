import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PricingCard({
  name,
  description,
  features,
  ctaLabel,
  ctaHref,
  featured,
}: {
  name: string;
  description: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  featured?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border p-8 shadow-card",
        featured ? "border-accent-ink bg-ink text-paper" : "border-line bg-surface text-ink",
      )}
    >
      {featured && (
        <span className="eyebrow mb-4 w-fit rounded-full bg-accent-ink px-3 py-1 text-white">
          Most common
        </span>
      )}
      <h2 className={cn("text-2xl", featured ? "text-paper" : "text-ink")}>{name}</h2>
      <p className={cn("mt-2 text-[14.5px] leading-relaxed", featured ? "text-paper/70" : "text-ink-muted")}>
        {description}
      </p>
      <ul className="mt-6 flex flex-1 flex-col gap-3">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-[14px]">
            <Check
              className={cn("mt-0.5 h-4 w-4 shrink-0", featured ? "text-accent" : "text-accent-ink")}
              aria-hidden="true"
            />
            <span className={featured ? "text-paper/90" : "text-ink-muted"}>{f}</span>
          </li>
        ))}
      </ul>
      <Button asChild variant={featured ? "inverse" : "secondary"} size="lg" className="mt-8">
        <Link href={ctaHref}>{ctaLabel}</Link>
      </Button>
    </div>
  );
}
