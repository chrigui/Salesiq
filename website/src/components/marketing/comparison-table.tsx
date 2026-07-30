import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ComparisonRow {
  label: string;
  values: (string | boolean)[];
}

export function ComparisonTable({
  columns,
  rows,
  highlightColumn,
}: {
  columns: string[];
  rows: ComparisonRow[];
  highlightColumn: number;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-surface shadow-card">
      <table className="w-full min-w-[640px] border-collapse text-left">
        <thead>
          <tr className="border-b border-line">
            <th className="p-4 text-[13px] font-medium text-ink-faint" />
            {columns.map((col, i) => (
              <th
                key={col}
                className={cn(
                  "p-4 text-[13.5px] font-semibold",
                  i === highlightColumn ? "bg-accent-wash text-accent-ink" : "text-ink",
                )}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={row.label} className={cn(ri !== rows.length - 1 && "border-b border-line-soft")}>
              <th scope="row" className="p-4 text-[13.5px] font-medium text-ink-muted">
                {row.label}
              </th>
              {row.values.map((value, i) => (
                <td
                  key={i}
                  className={cn(
                    "p-4 text-[13.5px] text-ink-muted",
                    i === highlightColumn && "bg-accent-wash/40 text-ink",
                  )}
                >
                  {typeof value === "boolean" ? (
                    value ? (
                      <Check className="h-4 w-4 text-accent-ink" aria-hidden="true" />
                    ) : (
                      <Minus className="h-4 w-4 text-ink-muted" aria-hidden="true" />
                    )
                  ) : (
                    value
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
