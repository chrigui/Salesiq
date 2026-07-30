import type { Config } from "tailwindcss";

// Tokens ported verbatim (hex → RGB triplet) from docs/overview.html and
// docs/product-bible.html's :root custom properties — the "audit doc"
// design language this site is required to match. See globals.css for the
// CSS custom property definitions these Tailwind tokens read from.
const config: Config = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "rgb(var(--paper) / <alpha-value>)",
        surface: {
          DEFAULT: "rgb(var(--surface) / <alpha-value>)",
          2: "rgb(var(--surface-2) / <alpha-value>)",
        },
        ink: {
          DEFAULT: "rgb(var(--ink) / <alpha-value>)",
          muted: "rgb(var(--ink-muted) / <alpha-value>)",
          faint: "rgb(var(--ink-faint) / <alpha-value>)",
        },
        line: {
          DEFAULT: "var(--line)",
          soft: "var(--line-soft)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          ink: "rgb(var(--accent-ink) / <alpha-value>)",
          wash: "var(--accent-wash)",
        },
        brass: "rgb(var(--brass) / <alpha-value>)",
        star: {
          DEFAULT: "rgb(var(--star) / <alpha-value>)",
          off: "var(--star-off)",
        },
        good: {
          DEFAULT: "rgb(var(--good) / <alpha-value>)",
          wash: "var(--good-wash)",
        },
        pending: {
          DEFAULT: "rgb(var(--pending) / <alpha-value>)",
          ink: "rgb(var(--pending-ink) / <alpha-value>)",
          wash: "var(--pending-wash)",
        },
        blueprint: {
          DEFAULT: "rgb(var(--blueprint) / <alpha-value>)",
          wash: "var(--blueprint-wash)",
        },
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "Iowan Old Style", "Palatino Linotype", "Palatino", "Book Antiqua", "Georgia", "ui-serif", "serif"],
        sans: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
        mono: ["SF Mono", "ui-monospace", "JetBrains Mono", "Cascadia Code", "Menlo", "Consolas", "monospace"],
      },
      maxWidth: {
        wide: "68rem",
        read: "42rem",
      },
      borderRadius: {
        xs: "4px",
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "14px",
        "2xl": "16px",
      },
      boxShadow: {
        card: "var(--shadow)",
      },
      backgroundImage: {
        "dotted-texture": "radial-gradient(var(--line) 1.1px, transparent 1.1px)",
      },
      backgroundSize: {
        dotted: "20px 20px",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "drift": {
          "0%": { transform: "translate3d(0,0,0)" },
          "100%": { transform: "translate3d(-20px,-20px,0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both",
        drift: "drift 40s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
