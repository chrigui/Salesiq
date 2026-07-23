"use client";

import { cx } from "@/components/ui/primitives";

/** Labelled field wrapper used throughout the Visual Builder forms. */
export function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cx("block", className)}>
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-ink-faint">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-ink-faint">{hint}</span>}
    </label>
  );
}

const inputBase =
  "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-brand/50";

export function TextInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(inputBase, className)} />;
}

export function TextArea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cx(inputBase, "resize-none", className)} />;
}

export function NumberInput({
  value,
  onValue,
  className,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> & {
  value: number | undefined;
  onValue: (n: number | undefined) => void;
}) {
  return (
    <input
      {...props}
      type="number"
      value={value ?? ""}
      onChange={(e) =>
        onValue(e.target.value === "" ? undefined : Number(e.target.value))
      }
      className={cx(inputBase, className)}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cx(inputBase, "appearance-none bg-ink-900/40", className)}
    >
      {children}
    </select>
  );
}
