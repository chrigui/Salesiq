import type { Variants } from "framer-motion";

/**
 * Shared, tasteful motion primitives. Kept deliberately small — a handful of
 * reused variants read as "one considered system"; a different easing curve
 * on every component reads as noise. Every consumer passes these through
 * Framer Motion's own `useReducedMotion` check at the call site (see
 * `fadeUpProps` below) rather than relying on CSS alone, since Framer
 * Motion doesn't read the `motion-reduce:` Tailwind variant.
 */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

export const staggerChildren: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08 },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

/** Standard scroll-reveal props for a Framer Motion element. */
export const revealOnScroll = {
  initial: "hidden",
  whileInView: "show",
  viewport: { once: true, margin: "-80px" },
} as const;
