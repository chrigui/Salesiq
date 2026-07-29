"use client";

import { useEffect, useState } from "react";

/**
 * System Monitoring (Module 5 · Platform Admin). There's no real
 * multi-tenant infrastructure behind this pilot, so — like the rest of the
 * Platform Admin console's illustrative tenant/revenue figures — these
 * metrics are simulated: a smooth random walk around a realistic baseline
 * per metric, ticking every few seconds so the panel feels alive rather
 * than a static screenshot. Thresholds still drive genuine status logic
 * (healthy/watch/critical), so the UI behaves like a real monitoring panel
 * would even though the numbers underneath are illustrative.
 */
export type MetricStatus = "healthy" | "watch" | "critical";

export interface SystemMetric {
  id: string;
  label: string;
  value: number;
  unit: string;
  status: MetricStatus;
  history: number[];
}

interface MetricSpec {
  id: string;
  label: string;
  unit: string;
  base: number;
  amplitude: number;
  /** Higher value = worse, e.g. CPU%; lower value = worse, e.g. free capacity. */
  direction: "higher-is-worse" | "lower-is-worse";
  watchAt: number;
  criticalAt: number;
}

const SPECS: MetricSpec[] = [
  { id: "cpu", label: "CPU", unit: "%", base: 34, amplitude: 12, direction: "higher-is-worse", watchAt: 70, criticalAt: 90 },
  { id: "memory", label: "Memory", unit: "%", base: 52, amplitude: 10, direction: "higher-is-worse", watchAt: 80, criticalAt: 92 },
  { id: "db", label: "Database latency", unit: "ms", base: 18, amplitude: 8, direction: "higher-is-worse", watchAt: 60, criticalAt: 120 },
  { id: "queue", label: "Job queue depth", unit: "jobs", base: 6, amplitude: 6, direction: "higher-is-worse", watchAt: 40, criticalAt: 100 },
  { id: "mqtt", label: "MQTT connections", unit: "conns", base: 342, amplitude: 40, direction: "lower-is-worse", watchAt: 200, criticalAt: 80 },
  { id: "ws", label: "WebSocket connections", unit: "conns", base: 118, amplitude: 25, direction: "lower-is-worse", watchAt: 60, criticalAt: 20 },
];

const HISTORY_LEN = 24;

function statusFor(spec: MetricSpec, value: number): MetricStatus {
  if (spec.direction === "higher-is-worse") {
    if (value >= spec.criticalAt) return "critical";
    if (value >= spec.watchAt) return "watch";
    return "healthy";
  }
  if (value <= spec.criticalAt) return "critical";
  if (value <= spec.watchAt) return "watch";
  return "healthy";
}

function walk(prev: number, spec: MetricSpec): number {
  const drift = (Math.random() - 0.5) * spec.amplitude * 0.35;
  const pull = (spec.base - prev) * 0.08; // gentle mean reversion so it doesn't wander off forever
  const next = prev + drift + pull;
  return Math.max(0, Math.round(next * 10) / 10);
}

function seedHistory(spec: MetricSpec): number[] {
  const out: number[] = [spec.base];
  for (let i = 1; i < HISTORY_LEN; i++) out.push(walk(out[i - 1], spec));
  return out;
}

/** Live, ticking system metrics — a smooth random walk per metric, updated every 2.5s. */
export function useSystemHealth(): SystemMetric[] {
  const [histories, setHistories] = useState<Record<string, number[]>>(() =>
    Object.fromEntries(SPECS.map((s) => [s.id, seedHistory(s)])),
  );

  useEffect(() => {
    const id = setInterval(() => {
      setHistories((prev) =>
        Object.fromEntries(
          SPECS.map((s) => {
            const h = prev[s.id] ?? seedHistory(s);
            const next = walk(h[h.length - 1], s);
            return [s.id, [...h.slice(-(HISTORY_LEN - 1)), next]];
          }),
        ),
      );
    }, 2500);
    return () => clearInterval(id);
  }, []);

  return SPECS.map((spec) => {
    const history = histories[spec.id] ?? seedHistory(spec);
    const value = history[history.length - 1];
    return {
      id: spec.id,
      label: spec.label,
      value,
      unit: spec.unit,
      status: statusFor(spec, value),
      history,
    };
  });
}
