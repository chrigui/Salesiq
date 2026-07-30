"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Search } from "lucide-react";
import { allSearchableItems } from "@/components/nav/nav-config";

/**
 * A real, working ⌘K palette scoped honestly to what exists: it searches
 * this site's own nav config (the live pages), not a fake search box wired
 * to a content corpus that doesn't exist yet.
 */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const items = useMemo(() => allSearchableItems(), []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const results = query.trim()
    ? items.filter((item) => item.label.toLowerCase().includes(query.trim().toLowerCase()))
    : items;

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="hidden items-center gap-2 rounded-lg border border-line px-3 py-2 text-[13px] text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink sm:flex"
        >
          <Search className="h-3.5 w-3.5" aria-hidden="true" />
          Search
          <kbd
            aria-hidden="true"
            className="ml-1 rounded border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-ink-muted"
          >
            ⌘K
          </kbd>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-ink/40 backdrop-blur-sm data-[state=open]:animate-fade-up" />
        <Dialog.Content className="fixed left-1/2 top-[18vh] z-[91] w-[min(560px,92vw)] -translate-x-1/2 overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
          <Dialog.Title className="sr-only">Search SalesIQ</Dialog.Title>
          <div className="flex items-center gap-2.5 border-b border-line px-4 py-3">
            <Search className="h-4 w-4 text-ink-faint" aria-hidden="true" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pages…"
              className="w-full bg-transparent text-[14.5px] text-ink placeholder:text-ink-faint focus:outline-none"
            />
          </div>
          <ul className="max-h-[50vh] overflow-y-auto p-2">
            {results.length === 0 && (
              <li className="px-3 py-6 text-center text-[13.5px] text-ink-muted">No pages match &ldquo;{query}&rdquo;.</li>
            )}
            {results.map((item) => (
              <li key={item.href}>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    router.push(item.href);
                  }}
                  className="flex w-full flex-col rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-surface-2"
                >
                  <span className="text-[14px] font-medium text-ink">{item.label}</span>
                  {item.description && <span className="text-[12.5px] text-ink-muted">{item.description}</span>}
                </button>
              </li>
            ))}
          </ul>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
