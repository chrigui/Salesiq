/**
 * The Salesperson Review screen's per-section EDIT/HIDE list — client-side
 * mirror of src/lib/serializers/recap.ts's defaultSectionVisibility(). Kept
 * as its own small copy (not a shared import) so the client bundle never
 * pulls in the server serializer's Prisma type import; the key set below
 * must stay identical to the server's.
 */
export interface RecapSectionDef {
  key: string;
  label: string;
}

export const RECAP_SECTIONS: RecapSectionDef[] = [
  { key: "customer", label: "Customer" },
  { key: "requirements", label: "Requirements" },
  { key: "shortlist", label: "Shortlist" },
  { key: "propertiesExplored", label: "Properties explored" },
  { key: "comparison", label: "Comparison" },
  { key: "finalRecommendation", label: "Final recommendation" },
  { key: "payment", label: "Payment information" },
  { key: "investment", label: "Investment information" },
  { key: "notes", label: "Notes & next steps" },
];

export type RecapSectionVisibility = Record<string, "show" | "hide">;

export function defaultRecapSectionVisibility(): RecapSectionVisibility {
  return Object.fromEntries(RECAP_SECTIONS.map((s) => [s.key, "show" as const]));
}
