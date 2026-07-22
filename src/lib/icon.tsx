"use client";

import * as Lucide from "lucide-react";
import type { LucideProps } from "lucide-react";

/**
 * Resolve a lucide-react icon by name (icons are configured as strings in the
 * industry packs). Falls back to a neutral dot when a name is unknown.
 */
export function Icon({
  name,
  ...props
}: { name?: string } & LucideProps) {
  const map = Lucide as unknown as Record<
    string,
    React.ComponentType<LucideProps>
  >;
  const Cmp = (name && map[name]) || Lucide.Circle;
  return <Cmp {...props} />;
}
