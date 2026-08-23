import type { InventoryItem } from "@/core/types";
import type { DisplayProfileAssetMeta } from "@/lib/serializers/displayProfile";
import type { MotionConfig } from "@/core/display/motionPresets";

export interface DisplayBranding {
  name: string;
  tagline: string;
  brand: string;
  brandSoft: string;
  logoGlyph: string;
}

export interface DisplayPackSummary {
  id: string;
  label: string;
  vertical: string;
  currency: string;
  branding: DisplayBranding;
}

export type DisplayTemplate =
  | "Minimal"
  | "NewDevelopment"
  | "Detailed"
  | "Lifestyle"
  | "Investment"
  | "LuxuryCinematic"
  | "Masterplan"
  | "Custom"
  | "Dashboard";

/**
 * Shared context every Display Studio widget needs — plain, serializable
 * data only, mirroring src/components/brochure/types.ts's
 * BrochureWidgetContext. The live/preview surface sets --brand/--brand-soft
 * as a scoped inline style on the wrapper (same pattern as BrochureView),
 * so widgets reach for the ordinary text-brand/bg-brand Tailwind classes
 * rather than threading color values through here.
 */
export interface DisplayWidgetContext {
  item: InventoryItem;
  pack: DisplayPackSummary;
  template: DisplayTemplate;
  /** "presentation" = a companion-focused item on the real live Customer Display; "idle" = the same Display's unattended attract state; "preview" = Display Studio's editor preview. Widgets can use this for honest empty-state framing, never to fake data. */
  mode: "presentation" | "idle" | "preview";
  /** This profile's uploaded documents (floor plans, masterplans, spec sheets) — real metadata only, never fabricated. */
  assets: DisplayProfileAssetMeta[];
  /** Base path a widget builds its own asset download URLs against, e.g. `${assetsBaseUrl}/${asset.id}`. */
  assetsBaseUrl: string;
  /** Resolved motion config for this profile — widgets use it for their own internal animation (e.g. Hero's Ken Burns zoom), never re-derive it from raw Json. */
  motion: MotionConfig;
  /** Up to 3 nearest other items in the same pack, by price/type proximity — real inventory data, no invented market comps. Same computation as the Brochure module's. */
  comparables: InventoryItem[];
  /** This physical Display's identity, when rendered live on a real paired kiosk (presentation/idle modes). Undefined in the editor's "preview" mode — widgets that need a real device (e.g. leadCapture) render an honest disabled state instead of submitting anywhere. */
  deviceId?: string;
  deviceToken?: string;
  /** This item's real score/reasons against the current live customer's answers (scoreInventory/narrate) — null when there's no active session to score against (idle mode, editor preview). Never fabricated: absent rather than guessed. */
  matchScore?: { score: number; reasons: string[] } | null;
}
