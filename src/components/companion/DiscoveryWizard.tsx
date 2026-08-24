"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, MapPinned, Loader2 } from "lucide-react";
import { useSession } from "@/core/store/session";
import { useLivePack } from "@/core/store/packs";
import { scoreInventory } from "@/core/engine/scoring";
import { submitConversationNote } from "@/core/store/buyerProfiles";
import type { BuyerExtractionFields } from "@/core/store/buyerProfiles";
import { QuestionControl } from "./CompanionApp";
import { useMeetingFlow } from "./meetingFlow";
import { DISCOVERY_GROUPS } from "./discoveryGroups";

interface GeocodeResult {
  label: string;
  lat: number;
  lng: number;
  nearestDistricts: { district: string; distanceKm: number }[];
}

/** Maps whatever the customer just told us into the existing BuyerExtractionFields
 * shape, reusing the real conversation-note commit path instead of a new one. */
function buildExtraction(pack: { id: string }, answers: Record<string, unknown>): BuyerExtractionFields {
  const extraction: BuyerExtractionFields = {};
  if (typeof answers.familySize === "number") extraction.familySize = answers.familySize;
  if (typeof answers.bedrooms === "number") extraction.bedrooms = answers.bedrooms;
  if (
    answers.budget &&
    typeof answers.budget === "object" &&
    "min" in (answers.budget as object) &&
    "max" in (answers.budget as object)
  ) {
    const { min, max } = answers.budget as { min: number; max: number };
    extraction.budget = `${min}-${max}`;
  }
  if (typeof answers.workLocation === "string" && answers.workLocation.trim()) {
    extraction.preferredLocation = answers.workLocation.trim();
  }
  const priorityFlags: { key: string; label: string }[] = [
    { key: "schools", label: "Schools" },
    { key: "seaView", label: "Sea view" },
    { key: "garden", label: "Garden" },
    { key: "quiet", label: "Quiet area" },
  ];
  const active = priorityFlags.filter((f) => answers[f.key] === true);
  if (active[0]) extraction.priorityLabel = active[0].label;
  if (active[1]) extraction.secondaryLabel = active[1].label;
  return extraction;
}

export function DiscoveryWizard() {
  const session = useSession();
  const pack = useLivePack(session.packId);
  const flow = useMeetingFlow();
  const groups = DISCOVERY_GROUPS[pack.id];

  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const [geocodeResult, setGeocodeResult] = useState<GeocodeResult | null>(null);
  const [finishing, setFinishing] = useState(false);

  // A pack with no wizard defined for it (Bahrain, Automotive, custom, …)
  // goes straight to the workspace — never a broken/empty step list.
  useEffect(() => {
    if (!groups) flow.goTo("workspace");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups]);

  const totalCount = pack.inventory.length;
  const matchCount = useMemo(() => {
    const scored = scoreInventory(pack, session.answers);
    return scored.filter((s) => s.score > 0).length;
  }, [pack, session.answers]);

  if (!groups) return null;

  const groupIndex = Math.min(flow.wizardGroupIndex, groups.length - 1);
  const group = groups[groupIndex];
  const isLast = groupIndex === groups.length - 1;
  const questions = group.questionIds
    .map((id) => pack.questions.find((q) => q.id === id))
    .filter((q): q is NonNullable<typeof q> => Boolean(q));

  const findArea = async () => {
    const query = typeof session.answers.workLocation === "string" ? session.answers.workLocation.trim() : "";
    if (!query || geocoding) return;
    setGeocoding(true);
    setGeocodeError(null);
    setGeocodeResult(null);
    try {
      const res = await fetch("/api/companion/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, packId: pack.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGeocodeError("Couldn't find that location — you can still continue.");
        return;
      }
      setGeocodeResult(data as GeocodeResult);
    } catch {
      setGeocodeError("Couldn't reach the location service — you can still continue.");
    } finally {
      setGeocoding(false);
    }
  };

  const advance = async () => {
    if (!isLast) {
      flow.setWizardGroupIndex(groupIndex + 1);
      return;
    }
    if (finishing) return;
    setFinishing(true);
    if (session.buyerProfileId) {
      const extracted = buildExtraction(pack, session.answers);
      if (Object.keys(extracted).length > 0) {
        const summary = `Captured during guided discovery: ${JSON.stringify(extracted)}`;
        await submitConversationNote(session.buyerProfileId, {
          rawText: summary,
          extracted,
          status: "confirmed",
          confirmedFields: extracted,
        });
      }
    }
    setFinishing(false);
    flow.goTo("workspace");
  };

  const back = () => {
    if (groupIndex > 0) flow.setWizardGroupIndex(groupIndex - 1);
  };

  return (
    <div className="bg-aurora flex min-h-screen flex-col items-center justify-center px-6 py-10">
      <div className="glass-strong w-full max-w-sm rounded-[2.2rem] p-8 ring-1 ring-white/10">
        <div className="mb-1 flex items-center justify-between">
          <button
            onClick={back}
            disabled={groupIndex === 0}
            aria-label="Back"
            className="grid h-7 w-7 place-items-center rounded-full text-ink-faint transition hover:bg-white/10 disabled:opacity-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-brand">
            Step {groupIndex + 1} of {groups.length}
          </span>
          <span className="w-7" />
        </div>

        <h1 className="mb-1 text-xl font-semibold text-ink">{group.title}</h1>
        <p className="mb-4 text-xs text-ink-faint">
          {matchCount} of {totalCount} properties match so far
        </p>

        <div className="space-y-3">
          {questions.map((q) => (
            <div key={q.id}>
              <QuestionControl question={q} />
              {q.id === "workLocation" && (
                <div className="mt-2">
                  <button
                    onClick={() => void findArea()}
                    disabled={geocoding || !session.answers.workLocation}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-brand/25 bg-brand/10 px-2.5 py-1.5 text-xs font-medium text-brand transition hover:bg-brand/20 disabled:opacity-40"
                  >
                    {geocoding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MapPinned className="h-3.5 w-3.5" />}
                    {geocoding ? "Finding area…" : "Find best-fit area"}
                  </button>

                  {geocodeError && <p className="mt-2 text-xs text-ink-faint">{geocodeError}</p>}

                  {geocodeResult && (
                    <div className="mt-2 space-y-1 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs">
                      <div className="flex justify-between">
                        <span className="text-ink-faint">Work location</span>
                        <span className="text-ink">{asText(session.answers.workLocation)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink-faint">Best-fit area</span>
                        <span className="font-medium text-brand">
                          {geocodeResult.nearestDistricts
                            .slice(0, 2)
                            .map((d) => d.district)
                            .join(" → ") || "—"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink-faint">Commute priority</span>
                        <span className="text-ink">High</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-2">
          <button
            onClick={() => void advance()}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-ink-muted transition hover:bg-white/10"
          >
            Not sure
          </button>
          <button
            onClick={() => void advance()}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-ink-muted transition hover:bg-white/10"
          >
            Skip
          </button>
          <button
            onClick={() => void advance()}
            disabled={finishing}
            className="flex-1 rounded-full bg-brand py-2 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {finishing ? "Saving…" : isLast ? "Finish" : "Next"}
          </button>
        </div>

        <button
          onClick={() => flow.goTo("workspace")}
          className="mt-4 w-full text-center text-xs text-ink-faint underline-offset-2 hover:underline"
        >
          Skip setup
        </button>
      </div>
    </div>
  );
}

function asText(v: unknown): string {
  return typeof v === "string" ? v : "";
}
