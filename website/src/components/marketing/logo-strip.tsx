import { IllustrativeNote } from "@/components/marketing/illustrative-note";

// Fictional wordmarks, deliberately — SalesIQ has no published enterprise
// customers yet. These stand in for "the kind of team that buys this,"
// not real companies, and the IllustrativeNote underneath says so.
const EXAMPLE_ORGS = [
  "Northbridge Realty Group",
  "Meridian Motors",
  "Highline Aviation Partners",
  "Cape & Anchor Yachts",
  "Sterling Property Collective",
  "Vantage Auto Holdings",
];

export function LogoStrip() {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
        {EXAMPLE_ORGS.map((name) => (
          <span
            key={name}
            className="font-serif text-[15px] italic tracking-tight text-ink-muted"
          >
            {name}
          </span>
        ))}
      </div>
      <IllustrativeNote className="justify-center text-center">
        Representative organization types — not published customers.
      </IllustrativeNote>
    </div>
  );
}
