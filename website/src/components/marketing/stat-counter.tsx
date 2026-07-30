"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useMotionValue, useSpring, useReducedMotion } from "framer-motion";

function AnimatedNumber({ value, decimals }: { value: number; decimals: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduceMotion = useReducedMotion();
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { damping: 24, stiffness: 90 });
  // Server-rendered and first client render must produce identical text —
  // useReducedMotion() can resolve differently between them, so the initial
  // render never branches on it. Reduced motion is handled by skipping the
  // spring animation inside the effect below, not by rendering different
  // text up front (that was the source of a real hydration mismatch).
  const [display, setDisplay] = useState(() => (0).toFixed(decimals));

  useEffect(() => {
    if (!inView) return;
    if (reduceMotion) {
      setDisplay(value.toFixed(decimals));
    } else {
      motionValue.set(value);
    }
  }, [inView, value, reduceMotion, decimals, motionValue]);

  useEffect(() => {
    const unsubscribe = spring.on("change", (v) => {
      setDisplay(v.toFixed(decimals));
    });
    return unsubscribe;
  }, [spring, decimals]);

  return (
    <span ref={ref} className="tabular-nums">
      {display}
    </span>
  );
}

export function StatCounter({
  value,
  decimals = 0,
  prefix,
  suffix,
  label,
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  label: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="text-4xl font-serif text-ink sm:text-5xl">
        {prefix}
        <AnimatedNumber value={value} decimals={decimals} />
        {suffix}
      </div>
      <p className="mt-2 text-[13.5px] text-ink-muted">{label}</p>
    </motion.div>
  );
}
