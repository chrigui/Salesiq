"use client";

import Link from "next/link";
import { ExternalLink, RotateCcw, Wand2 } from "lucide-react";
import { Panel } from "@/components/console/ConsoleShell";
import { Select } from "./fields";
import { PACKS } from "@/core/industries";
import { hasDraft, resetPack, useDraftedPackIds } from "@/core/store/packs";
import { QuestionBuilder } from "./QuestionBuilder";
import { InventoryBuilder } from "./InventoryBuilder";
import { RulesBuilder } from "./RulesBuilder";
import { BrandingBuilder } from "./BrandingBuilder";

export type BuilderKind = "questions" | "inventory" | "rules" | "branding";

const TITLES: Record<BuilderKind, string> = {
  questions: "Question builder",
  inventory: "Inventory builder",
  rules: "Scoring rules",
  branding: "Branding",
};

/**
 * The Visual Builder shell. Picks which installed pack to edit, shows whether
 * it currently carries unsaved-to-code customisations, and lets the admin
 * revert to the shipped config. Edits stream live to the companion + display.
 */
export function BuilderSection({
  kind,
  packId,
  onPackChange,
}: {
  kind: BuilderKind;
  packId: string;
  onPackChange: (id: string) => void;
}) {
  // Re-render when drafts change so the "Customised" badge stays accurate.
  const drafted = useDraftedPackIds();
  const customised = drafted.includes(packId) || hasDraft(packId);

  return (
    <Panel title={TITLES[kind]}>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-faint">Editing pack</span>
          <Select
            value={packId}
            onChange={(e) => onPackChange(e.target.value)}
            className="w-auto"
          >
            {PACKS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </Select>
        </div>

        {customised && (
          <span className="inline-flex items-center gap-1 rounded-full bg-brand/15 px-2.5 py-1 text-[11px] font-medium text-brand ring-1 ring-brand/25">
            <Wand2 className="h-3 w-3" /> Customised
          </span>
        )}

        <div className="ml-auto flex items-center gap-2">
          {customised && (
            <button
              onClick={() => {
                if (
                  confirm(
                    "Revert this pack to its shipped questions and inventory?",
                  )
                ) {
                  resetPack(packId);
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs text-ink-muted transition hover:bg-white/5"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Revert
            </button>
          )}
          <Link
            href="/companion"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs text-ink-muted transition hover:bg-white/5"
          >
            Preview <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {kind === "questions" ? (
        <QuestionBuilder packId={packId} />
      ) : kind === "inventory" ? (
        <InventoryBuilder packId={packId} />
      ) : kind === "rules" ? (
        <RulesBuilder packId={packId} />
      ) : (
        <BrandingBuilder packId={packId} />
      )}
    </Panel>
  );
}
