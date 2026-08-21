/**
 * Shared primitive for the explicit/inferred/observed distinction the spec
 * requires everywhere (§1) — defined once, reused across every Buyer
 * Profile field that can carry more than a bare value, so provenance
 * travels with the data itself instead of being reconstructed ad hoc per
 * field. Never present inferred information as confirmed fact: any UI
 * rendering a BuyerField must show its provenance, not just its value.
 */
export interface BuyerField<T> {
  value: T;
  provenance: "explicit" | "inferred" | "observed";
  confidence?: "high" | "medium" | "low";
  evidence?: string[];
  updatedAt: number;
}

export function explicitField<T>(value: T, evidence?: string[]): BuyerField<T> {
  return { value, provenance: "explicit", evidence, updatedAt: Date.now() };
}

export function observedField<T>(value: T, evidence?: string[]): BuyerField<T> {
  return { value, provenance: "observed", evidence, updatedAt: Date.now() };
}

export function inferredField<T>(
  value: T,
  confidence: "high" | "medium" | "low",
  evidence?: string[],
): BuyerField<T> {
  return { value, provenance: "inferred", confidence, evidence, updatedAt: Date.now() };
}
