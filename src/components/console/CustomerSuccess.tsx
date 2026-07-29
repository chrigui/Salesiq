"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Circle,
  Compass,
  HeartPulse,
  Lightbulb,
  Sparkles,
} from "lucide-react";
import { Panel } from "@/components/console/light-ui";
import { cx } from "@/components/ui/primitives";
import { useAllPacks } from "@/core/store/packs";
import { useLeads } from "@/core/store/leads";
import { useUsers } from "@/core/data/users";
import { useKnowledgeBase } from "@/core/data/knowledgeBase";
import { getIntegrationSettings } from "@/core/data/integrations";
import { ProductTour } from "@/components/console/ProductTour";

/**
 * Client Success (Module 11): Onboarding checklist, Health Score, Adoption
 * Dashboard and AI Coach in one place. Every signal is computed live from
 * real tenant data — packs, leads, users, knowledge base, integrations —
 * not a canned demo checklist.
 */
export function CustomerSuccess() {
  const packs = useAllPacks();
  const leads = useLeads();
  const users = useUsers();
  const knowledge = useKnowledgeBase();
  const [tourOpen, setTourOpen] = useState(false);

  const hasConfiguredPack = packs.some((p) => p.questions.length > 0 && p.inventory.length > 0);
  const hasRules = packs.some((p) => (p.ruleSpecs?.length ?? 0) > 0);
  const hasBranding = packs.some((p) => p.branding.tagline && p.branding.tagline !== "Find the right fit, every time.");
  const hasTeam = users.filter((u) => u.status === "active").length > 1;
  const hasLead = leads.length > 0;
  const hasKnowledge = knowledge.length > 2; // > the two seeded defaults
  const hasIntegration = getIntegrationSettings().webhookEnabled;

  const steps = [
    { id: "pack", label: "Set up questions & inventory for a pack", done: hasConfiguredPack },
    { id: "rules", label: "Add scoring rules so recommendations rank", done: hasRules },
    { id: "branding", label: "Customize your branding", done: hasBranding },
    { id: "team", label: "Invite a teammate", done: hasTeam },
    { id: "lead", label: "Run a session and capture a lead", done: hasLead },
    { id: "knowledge", label: "Add a Knowledge Base fact", done: hasKnowledge },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const onboardingPct = Math.round((doneCount / steps.length) * 100);

  // Adoption + health score — weighted signals across the product surface.
  const adoption = [
    { label: "Industry packs configured", active: hasConfiguredPack },
    { label: "Scoring rules", active: hasRules },
    { label: "Custom branding", active: hasBranding },
    { label: "Team collaboration", active: hasTeam },
    { label: "Lead capture", active: hasLead },
    { label: "Knowledge Base", active: hasKnowledge },
    { label: "Integrations", active: hasIntegration },
  ];
  const adoptionCount = adoption.filter((a) => a.active).length;
  const healthScore = Math.round((adoptionCount / adoption.length) * 100);
  const healthBand = healthScore >= 70 ? "healthy" : healthScore >= 40 ? "watch" : "at-risk";
  const healthStyle = {
    healthy: "text-emerald-600 bg-emerald-100",
    watch: "text-amber-600 bg-amber-100",
    "at-risk": "text-rose-600 bg-rose-100",
  }[healthBand];

  const tips: { text: string; icon: typeof Lightbulb }[] = [];
  if (!hasRules) tips.push({ text: "Add at least one scoring rule — without one, recommendations can't rank items.", icon: Lightbulb });
  if (!hasBranding) tips.push({ text: "Update your tagline in Branding so proposals feel like your business, not the template.", icon: Lightbulb });
  if (!hasTeam) tips.push({ text: "Invite a teammate from Team so leads can be assigned and followed up.", icon: Lightbulb });
  if (leads.some((l) => l.followUpAt != null && l.followUpAt < Date.now() && l.status !== "won" && l.status !== "lost")) {
    tips.push({ text: "You have overdue follow-ups in Leads — check the Notifications tab.", icon: Lightbulb });
  }
  if (!hasKnowledge) tips.push({ text: "Add a financing or policy fact to the Knowledge Base so AI proposals can quote it.", icon: Lightbulb });
  if (tips.length === 0) tips.push({ text: "You're fully set up — nice work. Keep an eye on Analytics for trends.", icon: Sparkles });

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
              <Compass className="h-3.5 w-3.5" /> Getting started
            </div>
            <span className="text-xs font-medium text-zinc-500">{doneCount}/{steps.length} complete</span>
          </div>
          <div className="mb-3 h-2 overflow-hidden rounded-full bg-zinc-100">
            <div className="h-full rounded-full bg-zinc-900 transition-all" style={{ width: `${onboardingPct}%` }} />
          </div>
          <div className="space-y-1.5">
            {steps.map((s) => (
              <div key={s.id} className="flex items-center gap-2 text-sm">
                {s.done ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-zinc-300" />
                )}
                <span className={cx(s.done ? "text-zinc-400 line-through" : "text-zinc-700")}>{s.label}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => setTourOpen(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50"
          >
            <Compass className="h-3.5 w-3.5" /> Take the product tour
          </button>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
            <HeartPulse className="h-3.5 w-3.5" /> Health score
          </div>
          <div className="mt-2 text-3xl font-bold tracking-tight tabular-nums text-zinc-900">{healthScore}</div>
          <span className={cx("mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-medium capitalize", healthStyle)}>
            {healthBand}
          </span>
          <p className="mt-3 text-xs text-zinc-400">Based on {adoptionCount} of {adoption.length} feature areas in active use</p>
        </div>
      </div>

      <Panel title="Feature adoption">
        <div className="grid gap-2 sm:grid-cols-2">
          {adoption.map((a) => (
            <div key={a.label} className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-2.5">
              <span className="text-sm text-zinc-700">{a.label}</span>
              <span className={cx("rounded-full px-2 py-0.5 text-[10px] font-medium", a.active ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-400")}>
                {a.active ? "Active" : "Not yet"}
              </span>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="AI Coach">
        <p className="mb-3 text-sm text-zinc-500">
          Suggestions computed from your actual setup — not generic tips.
        </p>
        <div className="space-y-2">
          {tips.map((tip, i) => (
            <div key={i} className="flex items-start gap-2.5 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700">
              <tip.icon className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              {tip.text}
            </div>
          ))}
        </div>
      </Panel>

      <ProductTour open={tourOpen} onClose={() => setTourOpen(false)} />
    </div>
  );
}
