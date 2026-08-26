/**
 * Spec section 33's "YOUR JOURNEY" jump nav — real in-page anchors to the
 * sections actually rendered below (RecapExperienceView only ever passes
 * steps whose section is currently visible), never a step that leads
 * nowhere. A plain anchor list, horizontally scrollable on narrow screens —
 * no JS state needed for a same-page jump.
 */
export interface RecapJourneyStep {
  id: string;
  label: string;
}

export function RecapJourneyTimeline({ steps }: { steps: RecapJourneyStep[] }) {
  if (steps.length === 0) return null;

  return (
    <nav className="scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4 py-1 sm:mx-0 sm:px-0">
      {steps.map((step) => (
        <a
          key={step.id}
          href={`#${step.id}`}
          className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-ink-muted transition hover:bg-white/10"
        >
          {step.label}
        </a>
      ))}
    </nav>
  );
}
