"use client";

import { RotateCcw, Sparkles } from "lucide-react";
import { Panel } from "@/components/console/light-ui";
import { cx } from "@/components/ui/primitives";
import {
  AI_TONES,
  resetAiSettings,
  saveAiSettings,
  useAiSettings,
} from "@/core/data/aiSettings";
import { Field, NumberInput } from "@/components/console/builder/fields";

const CREATIVITY_LABELS: { max: number; label: string }[] = [
  { max: 0.25, label: "Focused" },
  { max: 0.55, label: "Balanced" },
  { max: 0.8, label: "Creative" },
  { max: 1, label: "Very creative" },
];

function creativityLabel(v: number): string {
  return CREATIVITY_LABELS.find((c) => v <= c.max)?.label ?? "Very creative";
}

/**
 * AI Settings (Module 4). Tenant-level controls over the Claude-authored
 * upgrade path shared by every AI surface — Decision Engine narration,
 * Proposal Writer, Email Generator, Objection Handler. Every setting here is
 * threaded straight into the matching /api/ai/* route's prompt and
 * `temperature`; the deterministic fallback each feature ships with is
 * unaffected, since there's no model to tune when one isn't being called.
 */
export function AiSettings() {
  const settings = useAiSettings();

  return (
    <div className="space-y-4">
      <Panel
        title="AI settings"
        right={
          <button
            onClick={() => {
              if (confirm("Reset AI settings to their defaults?")) resetAiSettings();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-500 transition hover:bg-zinc-50"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset to defaults
          </button>
        }
      >
        <p className="mb-4 text-sm text-zinc-500">
          These controls shape how Claude writes proposals, follow-up emails,
          objection responses and top-pick narration whenever{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs">ANTHROPIC_API_KEY</code>{" "}
          is set. Every deterministic fallback works the same regardless — it
          never calls a model, so there's nothing here to tune.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Model">
            <div className="flex h-[42px] items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-500">
              <Sparkles className="h-3.5 w-3.5 text-zinc-400" />
              Claude Opus 4.8
            </div>
          </Field>

          <Field label="Tone" hint="Applied to every AI-authored surface">
            <div className="flex flex-wrap gap-1.5">
              {AI_TONES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => saveAiSettings({ tone: t.id })}
                  className={cx(
                    "rounded-full px-3 py-1.5 text-xs font-medium transition",
                    settings.tone === t.id
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </Field>

          <Field
            label={`Creativity — ${creativityLabel(settings.creativity)}`}
            className="sm:col-span-2"
            hint="Maps to Claude's temperature. Lower is more consistent; higher varies more."
          >
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={settings.creativity}
              onChange={(e) => saveAiSettings({ creativity: Number(e.target.value) })}
              className="w-full accent-zinc-900"
            />
          </Field>

          <Field label="Max Knowledge Base facts per call">
            <NumberInput
              value={settings.maxKnowledgeFacts}
              min={0}
              max={20}
              onValue={(v) => saveAiSettings({ maxKnowledgeFacts: v ?? 6 })}
            />
          </Field>

          <Field label="Guardrail">
            <button
              onClick={() => saveAiSettings({ knowledgeOnly: !settings.knowledgeOnly })}
              className={cx(
                "flex h-[42px] w-full items-center justify-between rounded-xl border px-3 text-sm font-medium transition",
                settings.knowledgeOnly
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50",
              )}
            >
              Knowledge-only mode
              <span
                className={cx(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  settings.knowledgeOnly ? "bg-white/20" : "bg-zinc-100",
                )}
              >
                {settings.knowledgeOnly ? "ON" : "OFF"}
              </span>
            </button>
          </Field>
        </div>
      </Panel>
    </div>
  );
}
