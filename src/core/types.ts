/**
 * Core domain model for the Decision Intelligence Platform.
 *
 * Nothing here is real-estate specific. An "industry pack" supplies the
 * questions, the inventory items, the scoring rules, and the branding — the
 * engine and UI are entirely driven by these configs. This is what lets a
 * single platform serve real estate, automotive, private jets, medical
 * equipment, insurance, and anything else.
 */

export type QuestionType =
  | "single" // one choice from options
  | "multi" // several choices
  | "budget" // currency range slider
  | "slider" // numeric slider
  | "toggle" // yes / no
  | "counter"; // integer stepper (e.g. family size)

export interface QuestionOption {
  id: string;
  label: string;
  /** lucide-react icon name, resolved on the client */
  icon?: string;
  value?: number | string | boolean;
}

export interface Question {
  id: string;
  /** Short label shown on the companion controller. */
  label: string;
  /** Full prompt shown on the customer display. */
  prompt: string;
  type: QuestionType;
  section: string;
  options?: QuestionOption[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  /** Conditional visibility: only show when this predicate passes. */
  showWhen?: Condition;
  /** How strongly this answer weighs on the recommendation. */
  weight?: number;
}

export type Condition = {
  questionId: string;
  op: "gt" | "gte" | "lt" | "lte" | "eq" | "includes" | "truthy";
  value?: number | string | boolean;
};

export interface InventoryItem {
  id: string;
  name: string;
  subtitle: string;
  price: number;
  currency: string;
  image: string; // gradient token or url
  location?: { label: string; lat: number; lng: number };
  /** Free-form numeric/boolean attributes matched against answers. */
  attributes: Record<string, number | string | boolean>;
  /** Human-readable highlights surfaced on the card. */
  highlights: string[];
  gallery?: string[];
  appreciation?: number; // % — used by investment scoring
}

/**
 * A scoring rule maps an answer to a contribution for an inventory item.
 * The engine evaluates every rule for every item and produces both a score
 * and a set of human-readable reasons — the "explain itself" requirement.
 */
export interface ScoringRule {
  id: string;
  questionId: string;
  /** Attribute on the inventory item this rule inspects. */
  attribute?: string;
  weight: number;
  /**
   * Returns a 0..1 match and a reason template when it contributes.
   * `answer` is the customer's answer, `item` the candidate.
   */
  evaluate: (
    answer: AnswerValue,
    item: InventoryItem,
  ) => { match: number; reason?: string } | null;
}

export type AnswerValue = number | string | boolean | string[] | BudgetValue;

export interface BudgetValue {
  min: number;
  max: number;
}

export interface Branding {
  name: string;
  tagline: string;
  /** rgb triplet strings, e.g. "99 102 241" */
  brand: string;
  brandSoft: string;
  logoGlyph: string; // single character / emoji used as mark
}

export interface IndustryPack {
  id: string;
  label: string;
  vertical: string;
  branding: Branding;
  sections: { id: string; label: string }[];
  questions: Question[];
  inventory: InventoryItem[];
  rules: ScoringRule[];
  currency: string;
}

export type Answers = Record<string, AnswerValue>;

export interface Recommendation {
  item: InventoryItem;
  score: number; // 0..100
  reasons: string[];
  /** Narrative explanation — the AI Decision Engine's headline output. */
  narrative: string;
}
