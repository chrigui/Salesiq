import type { IndustryPack } from "@/core/types";
import type { ScoredItem } from "./scoring";

/**
 * The AI Decision Engine's explanation layer.
 *
 * The platform's core promise is that a recommendation always explains itself.
 * This module builds a natural-language narrative deterministically from the
 * scoring breakdown so it works fully offline and is instant on-screen.
 *
 * A production deployment can swap `narrate` for a call to the Claude API
 * (see `buildNarrationPrompt`) to get richer, tenant-tuned prose — the
 * function signature is identical, so the UI does not change.
 */

// Clauses are joined onto reasons that already begin with "it ...", so these
// connectors read naturally once that leading subject is stripped.
const CONNECTORS = ["it also", "plus it", "and it"];

/** Deterministic, offline narrative — reads like a human sales advisor. */
export function narrate(scored: ScoredItem, pack: IndustryPack): string {
  const { item, reasons, score } = scored;
  const price = formatMoney(item.price, item.currency);

  if (reasons.length === 0) {
    return `${item.name} is a strong all-round option at ${price}. Answer a few more questions and the recommendation will sharpen.`;
  }

  const strengthWord =
    score >= 80
      ? "an excellent match"
      : score >= 60
        ? "a strong match"
        : "a promising fit";

  const [first, ...rest] = reasons;
  const clauses: string[] = [`it ${stripIt(first)}`];

  rest.slice(0, 3).forEach((reason, i) => {
    const connector = CONNECTORS[Math.min(i, CONNECTORS.length - 1)];
    clauses.push(`${connector} ${stripIt(reason)}`);
  });

  let narrative = `Based on your answers, ${item.name} is ${strengthWord} — ${clauses.join(
    ", ",
  )}.`;
  if (item.appreciation && item.appreciation > 0) {
    narrative += ` It has also shown ${item.appreciation}% appreciation over the last three years.`;
  }
  narrative += ` At ${price}, it sits comfortably within the range you set.`;
  return narrative;
}

/** Remove a leading "it " so a reason can follow any connector cleanly. */
function stripIt(reason: string): string {
  return reason.replace(/^it\s+/i, "");
}

/**
 * The prompt a production deployment would send to the Claude API in place of
 * the deterministic narrator. Kept here so the seam is explicit and reviewable.
 */
export function buildNarrationPrompt(
  scored: ScoredItem,
  pack: IndustryPack,
): string {
  const facts = scored.breakdown
    .filter((b) => b.reason)
    .map((b) => `- ${b.reason} (weight ${b.contribution.toFixed(1)})`)
    .join("\n");
  return [
    `You are the sales advisor for ${pack.branding.name}, a ${pack.vertical} business.`,
    `Explain in 2-3 warm, confident sentences why "${scored.item.name}" is recommended.`,
    `Only use these verified facts — never invent numbers:`,
    facts,
    `Overall match score: ${scored.score}/100. Price: ${formatMoney(
      scored.item.price,
      scored.item.currency,
    )}.`,
  ].join("\n");
}

export function formatMoney(n: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${currency} ${n.toLocaleString()}`;
  }
}
