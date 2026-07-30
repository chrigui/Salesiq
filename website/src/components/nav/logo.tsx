import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span
        aria-hidden="true"
        className="grid h-7 w-7 place-items-center rounded-md bg-accent-ink text-[13px] font-bold text-white"
      >
        S
      </span>
      <span className="font-mono text-[13px] font-semibold uppercase tracking-[0.18em] text-ink">
        SalesIQ
      </span>
    </Link>
  );
}
