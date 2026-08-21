import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { DEFAULT_AI_PROMPTS } from "@/core/display/aiPrompts";
import type { DisplayWidgetContext } from "../types";

const ROTATE_MS = 6_000;

/** Rotating hint that the AI concierge is available — same example prompts as the idle attract loop, cycling on a timer. */
export function DisplayAiPromptTicker({ motion }: DisplayWidgetContext) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (motion.reduceMotion) return;
    const t = window.setInterval(() => setI((n) => (n + 1) % DEFAULT_AI_PROMPTS.length), ROTATE_MS);
    return () => window.clearInterval(t);
  }, [motion.reduceMotion]);

  return (
    <section className="mx-auto max-w-3xl px-6 py-6 sm:px-10">
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
        <Sparkles className="h-4 w-4 shrink-0 text-brand" />
        <p className="text-sm text-white/80">{DEFAULT_AI_PROMPTS[i]}</p>
      </div>
    </section>
  );
}
