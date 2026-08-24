"use client";

import { GitCompareArrows } from "lucide-react";
import type { IndustryPack } from "@/core/types";
import type { ScoredItem } from "@/core/engine/scoring";
import { useSession } from "@/core/store/session";
import { ComparisonExperience } from "./ComparisonExperience";

export function CompareTab({ pack, scored }: { pack: IndustryPack; scored: ScoredItem[] }) {
  const session = useSession();

  if (session.compareItemIds.length < 2) {
    return (
      <div className="glass-strong flex flex-col items-center gap-3 rounded-[1.6rem] p-8 text-center ring-1 ring-white/10">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-white/5 text-ink-faint">
          <GitCompareArrows className="h-6 w-6" />
        </div>
        <p className="text-sm text-ink-faint">
          Drag two properties together in Matches or All Properties to start a comparison.
        </p>
      </div>
    );
  }

  return <ComparisonExperience pack={pack} scored={scored} />;
}
