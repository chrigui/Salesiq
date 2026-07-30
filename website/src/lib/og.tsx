export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

const PAPER = "#f0f3f0";
const INK = "#15201b";
const INK_MUTED = "#55605a";
const ACCENT_INK = "#0a6f47";
const ACCENT_WASH = "rgba(14, 143, 91, 0.1)";
const LINE = "rgba(21, 32, 27, 0.12)";

/** A single branded OG-card layout reused by every page's opengraph-image.tsx. */
export function ogImageElement(title: string, eyebrow = "SalesIQ") {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: PAPER,
        padding: "72px",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `radial-gradient(${LINE} 2px, transparent 2px)`,
          backgroundSize: "28px 28px",
          opacity: 0.7,
        }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: ACCENT_INK,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: 20,
            fontWeight: 700,
          }}
        >
          S
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 4, color: INK, textTransform: "uppercase" }}>
          {eyebrow}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 980 }}>
        <div
          style={{
            display: "flex",
            alignSelf: "flex-start",
            fontSize: 20,
            fontWeight: 600,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: ACCENT_INK,
            background: ACCENT_WASH,
            padding: "8px 18px",
            borderRadius: 999,
          }}
        >
          Decision Intelligence
        </div>
        <div style={{ display: "flex", fontSize: 64, fontWeight: 700, color: INK, lineHeight: 1.08 }}>{title}</div>
        <div style={{ display: "flex", fontSize: 26, color: INK_MUTED }}>
          The Enterprise AI Decision Intelligence platform.
        </div>
      </div>
    </div>
  );
}
