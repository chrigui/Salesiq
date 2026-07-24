"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Menu, Search, X } from "lucide-react";
import { Icon } from "@/lib/icon";
import { cx } from "@/components/ui/primitives";

export interface NavItem {
  id: string;
  label: string;
  icon: string;
}
export interface NavGroup {
  heading?: string;
  items: NavItem[];
}

/**
 * Light, sidebar-driven chrome for the admin consoles (Company + Platform).
 * Clean, bright, data-dense — the reference "SaaS dashboard" look.
 */
export function DashboardShell({
  workspaceKind,
  workspaceName,
  glyph,
  greeting,
  groups,
  active,
  onSelect,
  children,
}: {
  workspaceKind: string;
  workspaceName: string;
  glyph: string;
  greeting: string;
  groups: NavGroup[];
  active: string;
  onSelect: (id: string) => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const activeLabel =
    groups.flatMap((g) => g.items).find((i) => i.id === active)?.label ?? active;

  const select = (id: string) => {
    onSelect(id);
    setOpen(false); // close the drawer after choosing on mobile
  };

  return (
    <div className="console flex h-screen bg-zinc-100 text-zinc-900">
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar — static on desktop, off-canvas drawer on mobile */}
      <aside
        className={cx(
          "fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-zinc-200 bg-white transition-transform duration-200 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center gap-2 p-3">
          <button className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-zinc-200 p-2.5 text-left transition hover:bg-zinc-50">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-zinc-900 text-sm font-semibold text-white">
              {glyph}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] text-zinc-400">{workspaceKind}</span>
              <span className="block truncate text-sm font-semibold">
                {workspaceName}
              </span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400" />
          </button>
          <button
            onClick={() => setOpen(false)}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
          {groups.map((group, gi) => (
            <div key={group.heading ?? gi}>
              {group.heading && (
                <div className="mb-1.5 px-3 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                  {group.heading}
                </div>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = item.id === active;
                  return (
                    <button
                      key={item.id}
                      onClick={() => select(item.id)}
                      className={cx(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                        isActive
                          ? "bg-zinc-100 font-medium text-zinc-900"
                          : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800",
                      )}
                    >
                      <Icon
                        name={item.icon}
                        className={cx(
                          "h-4 w-4 shrink-0",
                          isActive ? "text-zinc-900" : "text-zinc-400",
                        )}
                      />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <button
              onClick={() => setOpen(true)}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-zinc-600 hover:bg-zinc-100 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex min-w-0 items-center gap-1.5 text-sm">
              <span className="hidden text-zinc-400 sm:inline">
                {workspaceKind === "Platform" ? "Admin" : "Dashboard"}
              </span>
              <ChevronRight className="hidden h-3.5 w-3.5 text-zinc-300 sm:inline" />
              <span className="truncate font-medium text-zinc-900">{activeLabel}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 rounded-xl border border-zinc-200 px-3 py-1.5 text-sm text-zinc-400 md:flex">
              <Search className="h-4 w-4" />
              <input
                placeholder="Search…"
                className="w-32 bg-transparent outline-none placeholder:text-zinc-400 lg:w-40"
              />
            </div>
            <Link
              href="/"
              className="whitespace-nowrap rounded-xl border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 transition hover:bg-zinc-50"
            >
              All products
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="mb-6 text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
            {greeting}
          </h1>
          {children}
        </main>
      </div>
    </div>
  );
}
