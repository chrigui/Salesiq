"use client";

import { useState } from "react";
import Link from "next/link";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronDown, Menu, X } from "lucide-react";
import { Logo } from "@/components/nav/logo";
import { ThemeToggle } from "@/components/nav/theme-toggle";
import { CommandPalette } from "@/components/nav/command-palette";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/marketing/container";
import { liveNavGroups, pricingItem } from "@/components/nav/nav-config";

export function SiteNav() {
  const groups = liveNavGroups();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/90 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between">
        <Logo />

        <NavigationMenu.Root className="relative hidden lg:block" delayDuration={80}>
          <NavigationMenu.List className="flex items-center gap-1">
            {groups.map((group) => (
              <NavigationMenu.Item key={group.label}>
                <NavigationMenu.Trigger className="group flex items-center gap-1 rounded-lg px-3 py-2 text-[14px] font-medium text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink data-[state=open]:text-ink">
                  {group.label}
                  <ChevronDown
                    className="h-3.5 w-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180"
                    aria-hidden="true"
                  />
                </NavigationMenu.Trigger>
                <NavigationMenu.Content className="absolute left-0 top-0 w-[340px] rounded-2xl border border-line bg-surface p-2 shadow-card data-[motion^=from]:animate-fade-up">
                  <ul className="flex flex-col">
                    {group.items.map((item) => (
                      <li key={item.href}>
                        <NavigationMenu.Link asChild>
                          <Link
                            href={item.href}
                            className="flex flex-col gap-0.5 rounded-xl px-3 py-2.5 transition-colors hover:bg-surface-2"
                          >
                            <span className="text-[14px] font-medium text-ink">{item.label}</span>
                            {item.description && (
                              <span className="text-[12.5px] text-ink-muted">{item.description}</span>
                            )}
                          </Link>
                        </NavigationMenu.Link>
                      </li>
                    ))}
                  </ul>
                </NavigationMenu.Content>
              </NavigationMenu.Item>
            ))}
            <NavigationMenu.Item>
              <NavigationMenu.Link asChild>
                <Link
                  href={pricingItem.href}
                  className="block rounded-lg px-3 py-2 text-[14px] font-medium text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
                >
                  {pricingItem.label}
                </Link>
              </NavigationMenu.Link>
            </NavigationMenu.Item>
          </NavigationMenu.List>

          <div className="absolute left-0 top-full flex justify-start pt-2">
            <NavigationMenu.Viewport className="origin-top-left" />
          </div>
        </NavigationMenu.Root>

        <div className="flex items-center gap-2">
          <CommandPalette />
          <ThemeToggle />
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/demo">Book a demo</Link>
          </Button>
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-lg border border-line text-ink lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-4.5 w-4.5" aria-hidden="true" />
          </button>
        </div>
      </Container>

      <MobileNav open={mobileOpen} onOpenChange={setMobileOpen} groups={groups} />
    </header>
  );
}

function MobileNav({
  open,
  onOpenChange,
  groups,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: ReturnType<typeof liveNavGroups>;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[95] bg-ink/40 backdrop-blur-sm lg:hidden" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-[96] flex w-full max-w-sm flex-col gap-6 overflow-y-auto bg-paper p-6 shadow-card data-[state=open]:animate-fade-up lg:hidden">
          <Dialog.Title className="sr-only">Menu</Dialog.Title>
          <div className="flex items-center justify-between">
            <Logo />
            <Dialog.Close asChild>
              <button type="button" className="grid h-9 w-9 place-items-center rounded-lg border border-line" aria-label="Close menu">
                <X className="h-4.5 w-4.5" aria-hidden="true" />
              </button>
            </Dialog.Close>
          </div>

          <nav className="flex flex-col gap-6">
            {groups.map((group) => (
              <div key={group.label}>
                <p className="eyebrow text-ink-muted">{group.label}</p>
                <ul className="mt-3 flex flex-col gap-1">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => onOpenChange(false)}
                        className="block rounded-lg px-2 py-2 text-[15px] font-medium text-ink"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <Link
              href={pricingItem.href}
              onClick={() => onOpenChange(false)}
              className="text-[15px] font-medium text-ink"
            >
              {pricingItem.label}
            </Link>
          </nav>

          <Button asChild size="lg" className="mt-auto">
            <Link href="/demo" onClick={() => onOpenChange(false)}>
              Book a demo
            </Link>
          </Button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
