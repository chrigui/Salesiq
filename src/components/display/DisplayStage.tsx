"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, MapPin, TrendingUp, Check, Star } from "lucide-react";
import { useSession } from "@/core/store/session";
import { getPack } from "@/core/industries";
import { scoreInventory, isVisible } from "@/core/engine/scoring";
import { narrate, formatMoney } from "@/core/engine/explain";
import { itemGradient, cx } from "@/components/ui/primitives";
import { Icon } from "@/lib/icon";
import type { Question, AnswerValue, InventoryItem } from "@/core/types";

const spring = { type: "spring", stiffness: 260, damping: 30 } as const;

export function DisplayStage() {
  const { packId, answers, activeQuestionId, view, focusedItemId, revision } =
    useSession();
  const pack = getPack(packId);

  const scored = useMemo(
    () => scoreInventory(pack, answers),
    [pack, answers],
  );
  const activeQuestion = pack.questions.find((q) => q.id === activeQuestionId);
  const focusedItem = pack.inventory.find((i) => i.id === focusedItemId);

  return (
    <div className="bg-aurora relative h-screen w-screen overflow-hidden">
      <BrandHeader
        name={pack.branding.name}
        glyph={pack.branding.logoGlyph}
        tagline={pack.branding.tagline}
      />

      <div className="absolute inset-0 grid place-items-center px-10 pb-14 pt-24">
        <AnimatePresence mode="wait">
          {view === "welcome" && (
            <Welcome key="welcome" pack={pack} />
          )}

          {view === "question" && activeQuestion && (
            <QuestionStage
              key={`q-${activeQuestion.id}-${revision}`}
              question={activeQuestion}
              answer={answers[activeQuestion.id]}
              pack={pack}
            />
          )}

          {view === "recommendation" && (
            <RecommendationStage
              key="rec"
              scored={scored}
              packVertical={pack.vertical}
              pack={pack}
            />
          )}

          {view === "compare" && (
            <CompareStage key="compare" scored={scored} pack={pack} />
          )}

          {view === "item" && focusedItem && (
            <ItemStage
              key={`item-${focusedItem.id}`}
              item={focusedItem}
              score={scored.find((s) => s.item.id === focusedItem.id)?.score ?? 0}
              reasons={
                scored.find((s) => s.item.id === focusedItem.id)?.reasons ?? []
              }
            />
          )}
        </AnimatePresence>
      </div>

      <ProgressDots pack={pack} answers={answers} />
    </div>
  );
}

function BrandHeader({
  name,
  glyph,
  tagline,
}: {
  name: string;
  glyph: string;
  tagline: string;
}) {
  return (
    <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-10 py-7">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand/20 text-xl text-brand ring-1 ring-brand/30">
          {glyph}
        </div>
        <div>
          <div className="text-lg font-semibold tracking-tight">{name}</div>
          <div className="text-xs text-ink-faint">{tagline}</div>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs text-ink-muted">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-brand" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
        </span>
        Live session
      </div>
    </div>
  );
}

function Welcome({ pack }: { pack: ReturnType<typeof getPack> }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={spring}
      className="text-center"
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, ...spring }}
        className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-ink-muted"
      >
        <Sparkles className="h-4 w-4 text-brand" /> Guided by your advisor
      </motion.div>
      <h1 className="mx-auto max-w-4xl text-6xl font-semibold leading-tight tracking-tight">
        Let&rsquo;s find the one that&rsquo;s{" "}
        <span className="text-gradient">right for you</span>.
      </h1>
      <p className="mx-auto mt-6 max-w-xl text-xl text-ink-muted">
        {pack.branding.tagline}
      </p>
    </motion.div>
  );
}

function QuestionStage({
  question,
  answer,
  pack,
}: {
  question: Question;
  answer: AnswerValue | undefined;
  pack: ReturnType<typeof getPack>;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={spring}
      className="w-full max-w-5xl text-center"
    >
      <div className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-brand">
        {pack.sections.find((s) => s.id === question.section)?.label}
      </div>
      <h2 className="mx-auto max-w-3xl text-5xl font-semibold leading-tight tracking-tight">
        {question.prompt}
      </h2>

      <div className="mt-12">
        <AnswerVisual question={question} answer={answer} />
      </div>
    </motion.div>
  );
}

function AnswerVisual({
  question,
  answer,
}: {
  question: Question;
  answer: AnswerValue | undefined;
}) {
  if (question.type === "single" || question.type === "multi") {
    const selected = Array.isArray(answer)
      ? answer
      : answer !== undefined
        ? [String(answer)]
        : [];
    return (
      <div className="flex flex-wrap justify-center gap-4">
        {question.options?.map((opt, i) => {
          const on = selected.includes(opt.id);
          return (
            <motion.div
              key={opt.id}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, ...spring }}
              className={cx(
                "flex min-w-[10rem] flex-col items-center gap-3 rounded-3xl px-8 py-7 transition-all duration-300",
                on
                  ? "glass-strong scale-105 ring-2 ring-brand"
                  : "glass opacity-60",
              )}
            >
              <Icon
                name={opt.icon}
                className={cx("h-9 w-9", on ? "text-brand" : "text-ink-muted")}
              />
              <span className="text-lg font-medium">{opt.label}</span>
            </motion.div>
          );
        })}
      </div>
    );
  }

  if (question.type === "toggle") {
    const on = answer === true;
    const off = answer === false;
    return (
      <div className="flex justify-center gap-5">
        {[
          { label: "Yes", active: on },
          { label: "No", active: off },
        ].map((o) => (
          <div
            key={o.label}
            className={cx(
              "grid h-28 w-40 place-items-center rounded-3xl text-2xl font-semibold transition-all",
              o.active ? "glass-strong scale-105 ring-2 ring-brand text-ink" : "glass text-ink-faint",
            )}
          >
            {o.active && <Check className="mr-2 inline h-6 w-6 text-brand" />}
            {o.label}
          </div>
        ))}
      </div>
    );
  }

  if (question.type === "counter") {
    const value = typeof answer === "number" ? answer : question.min ?? 0;
    return (
      <motion.div
        key={value}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={spring}
        className="glass-strong mx-auto grid h-44 w-44 place-items-center rounded-full ring-2 ring-brand/40"
      >
        <span className="text-7xl font-semibold text-gradient">{value}</span>
      </motion.div>
    );
  }

  if (question.type === "budget") {
    const b =
      answer && typeof answer === "object" && "max" in answer
        ? answer
        : { min: question.min ?? 0, max: question.max ?? 0 };
    return (
      <div className="mx-auto max-w-2xl">
        <div className="text-5xl font-semibold text-gradient">
          {formatMoney(b.min, question.unit ?? "USD")} –{" "}
          {formatMoney(b.max, question.unit ?? "USD")}
        </div>
        <RangeBar
          min={question.min ?? 0}
          max={question.max ?? 0}
          from={b.min}
          to={b.max}
        />
      </div>
    );
  }

  // slider / number
  const value = typeof answer === "number" ? answer : question.min ?? 0;
  return (
    <div className="mx-auto max-w-2xl">
      <div className="text-6xl font-semibold text-gradient">
        {value.toLocaleString()} {question.unit}
      </div>
      <RangeBar
        min={question.min ?? 0}
        max={question.max ?? 100}
        from={question.min ?? 0}
        to={value}
      />
    </div>
  );
}

function RangeBar({
  min,
  max,
  from,
  to,
}: {
  min: number;
  max: number;
  from: number;
  to: number;
}) {
  const span = Math.max(1, max - min);
  const left = ((from - min) / span) * 100;
  const width = ((to - from) / span) * 100;
  return (
    <div className="mt-8 h-3 w-full overflow-hidden rounded-full bg-white/10">
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-brand to-brand-soft"
        initial={{ x: `${left}%`, width: 0 }}
        animate={{ x: `${left}%`, width: `${Math.max(width, 2)}%` }}
        transition={spring}
      />
    </div>
  );
}

function RecommendationStage({
  scored,
  pack,
}: {
  scored: ReturnType<typeof scoreInventory>;
  packVertical: string;
  pack: ReturnType<typeof getPack>;
}) {
  const best = scored[0];
  if (!best) return null;
  const narrative = narrate(best, pack);
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={spring}
      className="grid w-full max-w-6xl grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center"
    >
      <ItemHero item={best.item} score={best.score} />
      <div>
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand/15 px-4 py-2 text-sm font-medium text-brand ring-1 ring-brand/30">
          <Sparkles className="h-4 w-4" /> AI recommendation
        </div>
        <h2 className="text-4xl font-semibold tracking-tight">
          {best.item.name}
        </h2>
        <p className="mt-1 text-lg text-ink-muted">{best.item.subtitle}</p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-6 text-xl leading-relaxed text-ink"
        >
          {narrative}
        </motion.p>

        <div className="mt-7 space-y-3">
          {best.reasons.slice(0, 4).map((r, i) => (
            <motion.div
              key={r}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="flex items-start gap-3"
            >
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand/20 text-brand">
                <Check className="h-4 w-4" />
              </span>
              <span className="text-lg text-ink-muted first-letter:uppercase">
                {r}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function CompareStage({
  scored,
  pack,
}: {
  scored: ReturnType<typeof scoreInventory>;
  pack: ReturnType<typeof getPack>;
}) {
  const top = scored.slice(0, 3);
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={spring}
      className="w-full max-w-6xl"
    >
      <h2 className="mb-8 text-center text-4xl font-semibold tracking-tight">
        Your top matches, side by side
      </h2>
      <div className="grid gap-6 md:grid-cols-3">
        {top.map((s, i) => (
          <motion.div
            key={s.item.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, ...spring }}
            className={cx(
              "glass overflow-hidden rounded-3xl",
              i === 0 && "ring-2 ring-brand",
            )}
          >
            <div
              className={cx(
                "relative h-36 bg-gradient-to-br",
                itemGradient(s.item.image),
              )}
            >
              {i === 0 && (
                <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white">
                  <Star className="h-3 w-3" /> Best match
                </div>
              )}
            </div>
            <div className="p-5">
              <div className="flex items-baseline justify-between">
                <h3 className="text-xl font-semibold">{s.item.name}</h3>
                <span className="text-sm font-semibold text-brand">
                  {s.score}
                </span>
              </div>
              <p className="text-sm text-ink-faint">{s.item.subtitle}</p>
              <p className="mt-3 text-lg font-semibold">
                {formatMoney(s.item.price, s.item.currency)}
              </p>
              <div className="mt-3 space-y-1.5">
                {s.item.highlights.slice(0, 3).map((h) => (
                  <div
                    key={h}
                    className="flex items-center gap-2 text-sm text-ink-muted"
                  >
                    <Check className="h-3.5 w-3.5 text-brand" /> {h}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function ItemStage({
  item,
  score,
  reasons,
}: {
  item: InventoryItem;
  score: number;
  reasons: string[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={spring}
      className="grid w-full max-w-6xl grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center"
    >
      <ItemHero item={item} score={score} large />
      <div>
        <h2 className="text-5xl font-semibold tracking-tight">{item.name}</h2>
        <p className="mt-2 text-xl text-ink-muted">{item.subtitle}</p>
        {item.location && (
          <div className="mt-3 flex items-center gap-2 text-ink-faint">
            <MapPin className="h-4 w-4" /> {item.location.label}
          </div>
        )}
        <p className="mt-6 text-4xl font-semibold text-gradient">
          {formatMoney(item.price, item.currency)}
        </p>
        <div className="mt-7 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {item.highlights.map((h) => (
            <div
              key={h}
              className="glass flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm"
            >
              <Check className="h-4 w-4 shrink-0 text-brand" /> {h}
            </div>
          ))}
        </div>
        {reasons.length > 0 && (
          <p className="mt-6 text-sm text-ink-faint">
            Matches you: {reasons.slice(0, 3).join(" · ")}
          </p>
        )}
      </div>
    </motion.div>
  );
}

function ItemHero({
  item,
  score,
  large,
}: {
  item: InventoryItem;
  score: number;
  large?: boolean;
}) {
  return (
    <div
      className={cx(
        "relative overflow-hidden rounded-[2rem] bg-gradient-to-br shadow-2xl shadow-black/50 ring-1 ring-white/10",
        itemGradient(item.image),
        large ? "h-[26rem]" : "h-80",
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      <div className="absolute left-6 top-6 grid h-16 w-16 place-items-center rounded-2xl bg-black/30 backdrop-blur">
        <div className="text-center">
          <div className="text-2xl font-bold leading-none text-white">
            {score}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-white/70">
            match
          </div>
        </div>
      </div>
      {item.appreciation ? (
        <div className="absolute bottom-6 left-6 flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-sm font-medium text-emerald-300 backdrop-blur">
          <TrendingUp className="h-4 w-4" /> +{item.appreciation}% / 3yr
        </div>
      ) : null}
    </div>
  );
}

function ProgressDots({
  pack,
  answers,
}: {
  pack: ReturnType<typeof getPack>;
  answers: Record<string, AnswerValue>;
}) {
  const visible = pack.questions.filter((q) => isVisible(q, answers));
  return (
    <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
      {visible.map((q) => (
        <div
          key={q.id}
          className={cx(
            "h-1.5 rounded-full transition-all duration-300",
            answers[q.id] !== undefined ? "w-8 bg-brand" : "w-3 bg-white/15",
          )}
        />
      ))}
    </div>
  );
}
