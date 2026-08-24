import type { AnswerValue } from "@/core/types";
import type { DisplayView } from "@/core/store/session";
import type { DemoStep } from "./DemoScript";

/**
 * Golden Demo Experience — the rehearsed, dead-safe 9-stage flow for a first
 * enterprise presentation (Welcome → Discover → Understand → Recommend →
 * Explain → Experience → Compare → Proposal → Share). Every stage below
 * drives a real, already-shipped session action or opens a real panel
 * (ProposalSheet) — there is no fabricated 10th view or static mockup screen
 * anywhere in this file. See /root/.claude/plans/gentle-sleeping-peach.md for
 * the full rationale.
 */
export const GOLDEN_DEMO_PACK_ID = "real-estate-bahrain";

/**
 * "Premium Villa in Budaiya" (bh-9) in the curated Bahrain pack — a real
 * listing, not a fabricated one. It's genuinely the top scorer against
 * GOLDEN_DEMO_ANSWERS below (6 bed / 7 bath / 352 m² villa vs. a 6-bed,
 * 7-bath villa search), so focusing it during the Experience stage isn't a
 * forced pick. See the Golden Demo Experience plan's PR2 for the
 * enrichment (units left, appreciation, gallery) applied to this listing.
 */
export const GOLDEN_DEMO_HERO_ITEM_ID = "bh-9";

const GOLDEN_DEMO_ANSWERS: Record<string, AnswerValue> = {
  household: "family",
  budget: { min: 260000, max: 400000 },
  bedrooms: 6,
  bathrooms: 7,
  propertyType: "villa",
  minArea: 300,
};

const GOLDEN_DEMO_CUSTOMER = {
  name: "Fahad Al Rashid",
  phone: "+973 3900 1122",
  email: "fahad@example.com",
  notes: "Relocating the extended family — wants space to entertain and a villa that reflects it.",
};

const GOLDEN_DEMO_STAKEHOLDER = {
  name: "Noor Al Rashid",
  role: "Co-decision maker",
  influence: "high" as const,
  notes: "Fahad's spouse — final say on the neighbourhood.",
};

/** The minimal slice of the session store the Golden Demo script drives. */
export interface GoldenDemoSession {
  reset: () => void;
  setPack: (packId: string) => void;
  answer: (questionId: string, value: AnswerValue) => void;
  setActiveQuestion: (questionId: string | null) => void;
  setView: (view: DisplayView) => void;
  focusItem: (itemId: string | null) => void;
  updateCustomer: (patch: Partial<{ name: string; phone: string; email: string; notes: string }>) => void;
  addStakeholder: (stakeholder: { name: string; role: string; influence: "high" | "medium" | "low"; notes: string }) => void;
}

export interface GoldenDemoUi {
  closeAllPanels: () => void;
  setActiveSection: (id: string) => void;
  setProposalOpen: (open: boolean) => void;
}

/**
 * Full reset back to the Golden Demo's curated starting point. Used by the
 * "Start Demo" entry point, the "Reset Demo" control in DemoScript, and
 * re-run every time the presenter jumps back to step 1 — so the flow is
 * always safe to restart mid-presentation.
 */
export function resetToGoldenStart(session: GoldenDemoSession): void {
  session.reset();
  session.setPack(GOLDEN_DEMO_PACK_ID);
  session.updateCustomer(GOLDEN_DEMO_CUSTOMER);
  session.addStakeholder(GOLDEN_DEMO_STAKEHOLDER);
}

export function buildGoldenDemoSteps(session: GoldenDemoSession, ui: GoldenDemoUi): DemoStep[] {
  return [
    {
      title: "Welcome",
      script: `"Let's walk through exactly what your buyers experience — starting the moment they sit down with us."`,
      run: () => {
        ui.closeAllPanels();
        resetToGoldenStart(session);
        session.setView("welcome");
        ui.setActiveSection("household");
      },
    },
    {
      title: "Discover",
      script: `"We start by learning who they are — household, budget, the basics that shape everything downstream."`,
      run: () => {
        ui.closeAllPanels();
        for (const [questionId, value] of Object.entries(GOLDEN_DEMO_ANSWERS)) {
          session.answer(questionId, value);
        }
        ui.setActiveSection("home");
        session.setActiveQuestion("propertyType");
      },
    },
    {
      title: "Understand",
      script: `"Nothing here is a form to fill in — the system is already weighing what matters most to this family."`,
      run: () => {
        ui.closeAllPanels();
      },
    },
    {
      title: "Recommend",
      script: `"And here's the top match — chosen for real, from the full inventory, against exactly what they told us."`,
      run: () => {
        ui.closeAllPanels();
        session.setView("recommendation");
      },
    },
    {
      title: "Explain",
      script: `"Every reason on screen traces back to a real answer they gave us — nothing here is generic."`,
      run: () => {
        ui.closeAllPanels();
        session.setView("recommendation");
      },
    },
    {
      title: "Experience",
      script: `"Let's step into the property itself — this is the live Display Studio experience, not a mockup."`,
      run: () => {
        ui.closeAllPanels();
        session.focusItem(GOLDEN_DEMO_HERO_ITEM_ID);
      },
    },
    {
      title: "Compare",
      script: `"If they're weighing more than one option, Compare puts the real shortlist side by side."`,
      run: () => {
        ui.closeAllPanels();
        session.setView("compare");
      },
    },
    {
      title: "Proposal",
      script: `"When they're ready, we generate a real proposal — AI-authored where it's configured — and put it straight on the screen in front of them."`,
      run: () => {
        ui.closeAllPanels();
        ui.setProposalOpen(true);
      },
    },
    {
      title: "Share",
      script: `"And it doesn't end when they walk out — one tap sends this exact session to their phone."`,
      run: () => {
        ui.setProposalOpen(true);
      },
    },
  ];
}
