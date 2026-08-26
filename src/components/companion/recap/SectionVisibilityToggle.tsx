"use client";

import { Eye, EyeOff } from "lucide-react";

/**
 * The Salesperson Review screen's per-section EDIT/HIDE control (spec
 * section 3). "Edit" means "shown to the customer, and still editable
 * here"; "Hide" excludes the section from the customer-facing recap
 * entirely — never a partial/half-redacted state.
 */
export function SectionVisibilityToggle({
  value,
  onChange,
}: {
  value: "show" | "hide";
  onChange: (value: "show" | "hide") => void;
}) {
  return (
    <div className="flex shrink-0 overflow-hidden rounded-full border border-white/10">
      <button
        type="button"
        onClick={() => onChange("show")}
        className={`flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium transition ${
          value === "show" ? "bg-brand text-white" : "bg-white/5 text-ink-faint hover:bg-white/10"
        }`}
      >
        <Eye className="h-3 w-3" />
        Edit
      </button>
      <button
        type="button"
        onClick={() => onChange("hide")}
        className={`flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium transition ${
          value === "hide" ? "bg-white/20 text-ink" : "bg-white/5 text-ink-faint hover:bg-white/10"
        }`}
      >
        <EyeOff className="h-3 w-3" />
        Hide
      </button>
    </div>
  );
}
