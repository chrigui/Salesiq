import { cn } from "@/lib/utils";

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-read",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow && <p className="eyebrow mb-3 text-accent-ink">{eyebrow}</p>}
      <h2 className="text-[clamp(1.7rem,3.2vw,2.3rem)] leading-[1.1] text-ink">{title}</h2>
      {subtitle && <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">{subtitle}</p>}
    </div>
  );
}
