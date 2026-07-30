import Link from "next/link";
import { Logo } from "@/components/nav/logo";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/marketing/container";
import { liveNavGroups, pricingItem } from "@/components/nav/nav-config";

export function SiteFooter() {
  // Fold the standalone Pricing link into an existing "Company" group if
  // one is live this phase, rather than rendering a second column with the
  // same header label.
  const groups = liveNavGroups().map((group) =>
    group.label === "Company" ? { ...group, items: [...group.items, pricingItem] } : group,
  );
  const hasCompanyGroup = groups.some((g) => g.label === "Company");

  return (
    <footer className="border-t border-line bg-surface-2">
      <Container className="py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr,1fr,1fr,1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-ink-muted">
              SalesIQ is the Decision Intelligence platform for enterprise sales teams selling
              complex, high-consideration purchases.
            </p>
            <Button asChild size="sm" className="mt-6">
              <Link href="/demo">Book a demo</Link>
            </Button>
          </div>

          {groups.map((group) => (
            <div key={group.label}>
              <p className="eyebrow text-ink-muted">{group.label}</p>
              <ul className="mt-4 flex flex-col gap-2.5">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-[14px] text-ink-muted transition-colors hover:text-ink">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {!hasCompanyGroup && (
            <div>
              <p className="eyebrow text-ink-muted">Company</p>
              <ul className="mt-4 flex flex-col gap-2.5">
                <li>
                  <Link href={pricingItem.href} className="text-[14px] text-ink-muted transition-colors hover:text-ink">
                    {pricingItem.label}
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-line pt-6 text-[12.5px] text-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} SalesIQ. All rights reserved.</p>
          <p>Decision Intelligence, defined.</p>
        </div>
      </Container>
    </footer>
  );
}
