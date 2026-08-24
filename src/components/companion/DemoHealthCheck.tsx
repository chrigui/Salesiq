"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, XCircle, Info, X, Loader2, ShieldCheck, RefreshCw } from "lucide-react";
import { cx } from "@/components/ui/primitives";

type CheckStatus = "pass" | "warn" | "fail" | "info";

interface Check {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
}

interface HealthResult {
  overall: CheckStatus;
  checks: Check[];
}

const STATUS_META: Record<CheckStatus, { icon: typeof CheckCircle2; className: string }> = {
  pass: { icon: CheckCircle2, className: "text-emerald-400" },
  warn: { icon: AlertTriangle, className: "text-amber-400" },
  fail: { icon: XCircle, className: "text-rose-400" },
  info: { icon: Info, className: "text-ink-faint" },
};

const OVERALL_LABEL: Record<CheckStatus, string> = {
  pass: "Ready to present",
  warn: "Ready, with a few things worth fixing first",
  fail: "Not ready — resolve the failures below",
  info: "Ready to present",
};

/**
 * Pre-presentation checklist for the Golden Demo Experience — calls the
 * secret-gated GET /api/ops/demo-health (its own DEMO_HEALTH_SECRET, never
 * SEED_TRIGGER_SECRET) and renders exactly what it reports: real DB/broker
 * reachability, real curated-data completeness, real proposal-engine and
 * display-pairing state. Nothing here is simulated — a failing check here
 * means the corresponding demo stage will genuinely be degraded.
 */
export function DemoHealthCheck({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [result, setResult] = useState<HealthResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const secret = process.env.NEXT_PUBLIC_DEMO_HEALTH_SECRET;

  const run = async () => {
    if (!secret) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ops/demo-health?secret=${encodeURIComponent(secret)}`);
      if (!res.ok) {
        setError("Health check endpoint isn't available (is DEMO_HEALTH_SECRET configured?).");
        setResult(null);
        return;
      }
      setResult(await res.json());
    } catch {
      setError("Couldn't reach the server — check your connection.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[65] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="glass-strong max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-3xl p-6 sm:rounded-3xl"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-brand" />
                <h3 className="text-lg font-semibold">Demo Health Check</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => void run()}
                  disabled={loading}
                  aria-label="Re-run health check"
                  className="grid h-8 w-8 place-items-center rounded-full bg-white/5 text-ink-muted transition hover:bg-white/10 disabled:opacity-40"
                >
                  <RefreshCw className={cx("h-4 w-4", loading && "animate-spin")} />
                </button>
                <button
                  onClick={onClose}
                  className="grid h-8 w-8 place-items-center rounded-full bg-white/5 text-ink-muted hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {!secret && (
              <p className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm text-ink-faint">
                Not configured — set DEMO_HEALTH_SECRET and NEXT_PUBLIC_DEMO_HEALTH_SECRET to enable this check.
              </p>
            )}

            {secret && loading && !result && (
              <div className="flex items-center gap-2 py-8 text-sm text-ink-faint">
                <Loader2 className="h-4 w-4 animate-spin" /> Running checks…
              </div>
            )}

            {error && <p className="text-sm text-rose-400">{error}</p>}

            {result && (
              <>
                <div
                  className={cx(
                    "mb-3 rounded-xl border px-3 py-2 text-sm font-semibold",
                    result.overall === "pass" || result.overall === "info"
                      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                      : result.overall === "warn"
                        ? "border-amber-400/30 bg-amber-400/10 text-amber-300"
                        : "border-rose-400/30 bg-rose-400/10 text-rose-300",
                  )}
                >
                  {OVERALL_LABEL[result.overall]}
                </div>
                <div className="space-y-2">
                  {result.checks.map((check) => {
                    const meta = STATUS_META[check.status];
                    const Icon = meta.icon;
                    return (
                      <div
                        key={check.id}
                        className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/[0.02] p-3"
                      >
                        <Icon className={cx("mt-0.5 h-4 w-4 shrink-0", meta.className)} />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-ink">{check.label}</div>
                          <div className="text-xs text-ink-faint">{check.detail}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
