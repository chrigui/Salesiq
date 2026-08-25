"use client";

import { create } from "zustand";
import type { Answers, AnswerValue } from "@/core/types";
import { DEFAULT_PACK_ID } from "@/core/industries";
import { createSessionBus, newOrigin } from "@/core/sync/session-bus";
import {
  createNetworkTransport,
  type NetworkTransport,
  type SyncStatus,
} from "@/core/sync/network";

/** What the big customer display is currently showing. */
export type DisplayView =
  | "welcome"
  | "question"
  | "recommendation"
  | "compare" // the existing, unrelated auto-compare of the top-3 scored items
  | "compareGroup" // a salesperson-curated compareItemIds group (Property Explorer)
  | "item"
  | "proposal"
  // The Decision Room's cinematic modes, additive to the union above — see
  // its own plan doc for the full conceptual mapping onto these 7 original
  // values plus these 8 new ones. Each is driven by presentItem(), never a
  // second scoring/data path.
  | "whyThis"
  | "whyNot"
  | "investment"
  | "lifestyle"
  | "floorPlan"
  | "location"
  | "payment"
  | "recap";

export interface CustomerInfo {
  name: string;
  phone: string;
  email: string;
  notes: string;
}

/**
 * Buying Committee Intelligence (roadmap P2). `customer` above models
 * exactly one contact; most real purchases involve more than one
 * stakeholder, so this is a small, separate list rather than a rework of
 * the primary-contact model everything else (leads, proposals) already
 * depends on.
 */
export type StakeholderInfluence = "high" | "medium" | "low";

export interface Stakeholder {
  id: string;
  name: string;
  role: string;
  influence: StakeholderInfluence;
  notes: string;
}

/**
 * Session Timeline (Module 3 — Sales Companion): "stores every interaction."
 * Events are kept structured (question id, raw value, view name, item id)
 * rather than pre-formatted strings, so the UI can render them against
 * whatever industry pack is active — the store itself stays pack-agnostic,
 * matching every other piece of shared session state.
 */
export type TimelineEventKind =
  | "pack"
  | "answer"
  | "clear-answer"
  | "view"
  | "focus"
  | "bookmark-add"
  | "bookmark-remove"
  | "compare-add"
  | "compare-remove"
  | "recap-add"
  | "recap-remove"
  | "customer"
  | "proposal"
  | "lead"
  | "demo"
  | "reset"
  | "objection"
  | "stakeholder";

export interface TimelineEvent {
  id: string;
  ts: number;
  kind: TimelineEventKind;
  questionId?: string;
  value?: AnswerValue;
  view?: DisplayView;
  itemId?: string | null;
  field?: keyof CustomerInfo;
  packId?: string;
  detail?: string;
}

const MAX_TIMELINE = 200;

/** The full, serialisable session state shared across surfaces. */
export interface SessionState {
  packId: string;
  answers: Answers;
  activeQuestionId: string | null;
  view: DisplayView;
  focusedItemId: string | null;
  bookmarks: string[];
  /**
   * A salesperson-curated comparison group — distinct from `bookmarks`
   * (an item can be shortlisted without being in the active comparison,
   * and vice versa). Synced like `bookmarks` because the Comparison
   * Experience can be pushed to the Customer Display.
   */
  compareItemIds: string[];
  /**
   * Items the salesperson has flagged for the (not-yet-built) LUMMA Recap
   * stage — same shape/plumbing as `compareItemIds`, kept separate because
   * "in the current comparison" and "worth recapping" are different
   * memberships (a property can leave the compare group but stay recap-worthy).
   */
  recapItemIds: string[];
  customer: CustomerInfo;
  /**
   * The persistent Buyer Intelligence identity this session has resolved to,
   * once the salesperson has entered enough contact info to match/create one
   * (see src/core/store/buyerProfiles.ts's linkBuyerProfile helper, called
   * from the Companion). Null until then — behavioral tracking and the
   * priority-weighted recommendation boost are both gated on this being set,
   * so anonymous browsing is never retroactively attributed to a buyer.
   */
  buyerProfileId: string | null;
  /**
   * Real geocoded coordinates for the "where do they work?" Discovery
   * question — not stored in `answers` because AnswerValue has no point
   * type. Set once via setWorkLocationGeo() after a successful geocode
   * (src/app/api/companion/geocode/route.ts); null until then, and
   * scoreInventory's commute option is only ever built when both are set.
   */
  workLocationLat: number | null;
  workLocationLng: number | null;
  stakeholders: Stakeholder[];
  timeline: TimelineEvent[];
  /**
   * The proposal narrative currently presented on the customer display
   * (Claude-authored or the deterministic writer's text) — set only when the
   * salesperson explicitly presents it, so the big screen never shows a
   * proposal that wasn't reviewed first.
   */
  proposalText: string | null;
  proposalEngine: string | null;
  /** Bumps on every meaningful change to drive display animations. */
  revision: number;
}

interface SessionActions {
  setPack: (packId: string) => void;
  answer: (questionId: string, value: AnswerValue) => void;
  clearAnswer: (questionId: string) => void;
  setActiveQuestion: (questionId: string | null) => void;
  setView: (view: DisplayView) => void;
  focusItem: (itemId: string | null) => void;
  /**
   * Sets the subject property AND the Display view it should present in,
   * as one atomic update/publish — unlike composing focusItem()+setView(),
   * which are two separate network messages and could let a remote Display
   * briefly render the wrong intermediate view under real latency.
   */
  presentItem: (itemId: string, view: DisplayView) => void;
  toggleBookmark: (itemId: string) => void;
  addToCompare: (itemId: string) => void;
  removeFromCompare: (itemId: string) => void;
  clearCompare: () => void;
  reorderCompare: (itemIds: string[]) => void;
  addToRecap: (itemId: string) => void;
  removeFromRecap: (itemId: string) => void;
  clearRecap: () => void;
  updateCustomer: (patch: Partial<CustomerInfo>) => void;
  linkBuyerProfile: (buyerProfileId: string | null) => void;
  setWorkLocationGeo: (lat: number | null, lng: number | null) => void;
  addStakeholder: (stakeholder: Omit<Stakeholder, "id">) => void;
  updateStakeholder: (id: string, patch: Partial<Stakeholder>) => void;
  removeStakeholder: (id: string) => void;
  /** Push a reviewed proposal onto the customer display and switch it into view. */
  presentProposal: (text: string, engine: string | null) => void;
  /** Record a interaction not covered by another action (proposal, lead saved…). */
  logEvent: (event: Omit<TimelineEvent, "id" | "ts">) => void;
  reset: () => void;
  /**
   * Starting a new meeting must not carry over the previous customer's
   * discovery answers — unlike `reset()` (which returns to the START
   * screen and also reverts the industry pack), this keeps whatever pack
   * the salesperson has deliberately selected for their kiosk/showroom and
   * clears only the per-customer discovery state.
   */
  resetForNewMeeting: () => void;
  /** Load a compelling, pre-filled scenario for a clean live demo. */
  loadDemo: () => void;
  /** Apply a full state received from another surface (no re-broadcast). */
  _applyRemote: (state: SessionState) => void;
  _hydrate: () => void;
}

function makeEvent(event: Omit<TimelineEvent, "id" | "ts">): TimelineEvent {
  return {
    ...event,
    id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ts: Date.now(),
  };
}

function pushEvent(
  timeline: TimelineEvent[],
  event: Omit<TimelineEvent, "id" | "ts">,
): TimelineEvent[] {
  return [...timeline, makeEvent(event)].slice(-MAX_TIMELINE);
}

const bus = createSessionBus<SessionState>(newOrigin("surface"));

// Optional cross-device transport (phone -> laptop), attached when a room is set.
let net: NetworkTransport<SessionState> | null = null;

function initialState(): SessionState {
  return {
    packId: DEFAULT_PACK_ID,
    answers: {},
    activeQuestionId: null,
    view: "welcome",
    focusedItemId: null,
    bookmarks: [],
    compareItemIds: [],
    recapItemIds: [],
    customer: { name: "", phone: "", email: "", notes: "" },
    buyerProfileId: null,
    workLocationLat: null,
    workLocationLng: null,
    stakeholders: [],
    timeline: [],
    proposalText: null,
    proposalEngine: null,
    revision: 0,
  };
}

/** Snapshot only the serialisable slice for broadcasting. */
function snapshot(s: SessionState & SessionActions): SessionState {
  return {
    packId: s.packId,
    answers: s.answers,
    activeQuestionId: s.activeQuestionId,
    view: s.view,
    focusedItemId: s.focusedItemId,
    bookmarks: s.bookmarks,
    compareItemIds: s.compareItemIds,
    recapItemIds: s.recapItemIds,
    customer: s.customer,
    buyerProfileId: s.buyerProfileId,
    workLocationLat: s.workLocationLat,
    workLocationLng: s.workLocationLng,
    stakeholders: s.stakeholders,
    timeline: s.timeline,
    proposalText: s.proposalText,
    proposalEngine: s.proposalEngine,
    revision: s.revision,
  };
}

export const useSession = create<SessionState & SessionActions>((set, get) => {
  // Any local mutation publishes the new snapshot to the other surfaces —
  // same-device (BroadcastChannel) and, when paired, cross-device (network).
  const publish = () => {
    const snap = snapshot(get());
    bus.publish(snap);
    net?.publish(snap);
  };
  const bump = (patch: Partial<SessionState>) => {
    set((s) => ({ ...patch, revision: s.revision + 1 }));
    publish();
  };

  return {
    ...initialState(),

    setPack: (packId) =>
      bump({
        packId,
        answers: {},
        activeQuestionId: null,
        view: "welcome",
        focusedItemId: null,
        bookmarks: [],
        compareItemIds: [],
        recapItemIds: [],
        timeline: pushEvent(get().timeline, { kind: "pack", packId }),
      }),

    answer: (questionId, value) => {
      set((s) => ({
        answers: { ...s.answers, [questionId]: value },
        activeQuestionId: questionId,
        view: "question",
        timeline: pushEvent(s.timeline, { kind: "answer", questionId, value }),
        revision: s.revision + 1,
      }));
      publish();
    },

    clearAnswer: (questionId) => {
      set((s) => {
        const next = { ...s.answers };
        delete next[questionId];
        return {
          answers: next,
          timeline: pushEvent(s.timeline, { kind: "clear-answer", questionId }),
          revision: s.revision + 1,
        };
      });
      publish();
    },

    setActiveQuestion: (questionId) =>
      bump({ activeQuestionId: questionId, view: "question" }),

    setView: (view) =>
      bump({ view, timeline: pushEvent(get().timeline, { kind: "view", view }) }),

    focusItem: (itemId) =>
      bump({
        focusedItemId: itemId,
        view: itemId ? "item" : "recommendation",
        timeline: pushEvent(get().timeline, { kind: "focus", itemId }),
      }),

    presentItem: (itemId, view) =>
      bump({
        focusedItemId: itemId,
        view,
        timeline: pushEvent(get().timeline, { kind: "focus", itemId, view }),
      }),

    toggleBookmark: (itemId) => {
      set((s) => {
        const adding = !s.bookmarks.includes(itemId);
        return {
          bookmarks: adding
            ? [...s.bookmarks, itemId]
            : s.bookmarks.filter((b) => b !== itemId),
          timeline: pushEvent(s.timeline, {
            kind: adding ? "bookmark-add" : "bookmark-remove",
            itemId,
          }),
          revision: s.revision + 1,
        };
      });
      publish();
    },

    addToCompare: (itemId) => {
      set((s) => {
        if (s.compareItemIds.includes(itemId)) return s;
        return {
          compareItemIds: [...s.compareItemIds, itemId],
          timeline: pushEvent(s.timeline, { kind: "compare-add", itemId }),
          revision: s.revision + 1,
        };
      });
      publish();
    },

    removeFromCompare: (itemId) => {
      set((s) => ({
        compareItemIds: s.compareItemIds.filter((id) => id !== itemId),
        timeline: pushEvent(s.timeline, { kind: "compare-remove", itemId }),
        revision: s.revision + 1,
      }));
      publish();
    },

    clearCompare: () => {
      set((s) => ({
        compareItemIds: [],
        timeline: pushEvent(s.timeline, { kind: "compare-remove", detail: "Cleared comparison" }),
        revision: s.revision + 1,
      }));
      publish();
    },

    reorderCompare: (itemIds) => {
      // Not logged to the timeline — a display-order tweak, not a new interaction.
      set((s) => ({ compareItemIds: itemIds, revision: s.revision + 1 }));
      publish();
    },

    addToRecap: (itemId) => {
      set((s) => {
        if (s.recapItemIds.includes(itemId)) return s;
        return {
          recapItemIds: [...s.recapItemIds, itemId],
          timeline: pushEvent(s.timeline, { kind: "recap-add", itemId }),
          revision: s.revision + 1,
        };
      });
      publish();
    },

    removeFromRecap: (itemId) => {
      set((s) => ({
        recapItemIds: s.recapItemIds.filter((id) => id !== itemId),
        timeline: pushEvent(s.timeline, { kind: "recap-remove", itemId }),
        revision: s.revision + 1,
      }));
      publish();
    },

    clearRecap: () => {
      set((s) => ({
        recapItemIds: [],
        timeline: pushEvent(s.timeline, { kind: "recap-remove", detail: "Cleared recap" }),
        revision: s.revision + 1,
      }));
      publish();
    },

    updateCustomer: (patch) => {
      // Not logged to the timeline — fires on every keystroke, would flood it.
      set((s) => ({ customer: { ...s.customer, ...patch } }));
      publish();
    },

    linkBuyerProfile: (buyerProfileId) => {
      // Not logged to the timeline — an implementation detail of resolving
      // identity, not a customer-facing interaction worth surfacing there.
      set({ buyerProfileId });
      publish();
    },

    setWorkLocationGeo: (lat, lng) => {
      // Not logged to the timeline — a derived detail of the workLocation
      // answer, not its own customer-facing interaction.
      set({ workLocationLat: lat, workLocationLng: lng });
      publish();
    },

    addStakeholder: (stakeholder) =>
      bump({
        stakeholders: [
          ...get().stakeholders,
          { ...stakeholder, id: `sh-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` },
        ],
        timeline: pushEvent(get().timeline, {
          kind: "stakeholder",
          detail: `Added ${stakeholder.name || "a stakeholder"} (${stakeholder.role || "role unset"})`,
        }),
      }),

    updateStakeholder: (id, patch) => {
      // Not logged to the timeline — fires on every keystroke, would flood it.
      set((s) => ({
        stakeholders: s.stakeholders.map((sh) => (sh.id === id ? { ...sh, ...patch } : sh)),
      }));
      publish();
    },

    removeStakeholder: (id) => {
      const removed = get().stakeholders.find((sh) => sh.id === id);
      bump({
        stakeholders: get().stakeholders.filter((sh) => sh.id !== id),
        timeline: pushEvent(get().timeline, {
          kind: "stakeholder",
          detail: `Removed ${removed?.name || "a stakeholder"} from the buying committee`,
        }),
      });
    },

    presentProposal: (text, engine) =>
      bump({
        proposalText: text,
        proposalEngine: engine,
        view: "proposal",
        timeline: pushEvent(get().timeline, {
          kind: "proposal",
          detail: "Presented the proposal on the customer screen",
        }),
      }),

    logEvent: (event) => {
      set((s) => ({
        timeline: pushEvent(s.timeline, event),
        revision: s.revision + 1,
      }));
      publish();
    },

    reset: () => {
      set({
        ...initialState(),
        timeline: [makeEvent({ kind: "reset", detail: "Session reset" })],
      });
      publish();
    },

    resetForNewMeeting: () => {
      set((s) => ({
        ...initialState(),
        packId: s.packId,
        timeline: [makeEvent({ kind: "reset", detail: "New meeting started" })],
      }));
      publish();
    },

    loadDemo: () => {
      set((s) => ({
        packId: "real-estate",
        answers: {
          household: "family",
          familySize: 5,
          budget: { min: 150000, max: 320000 },
          bedrooms: 4,
          schools: true,
          garden: true,
          quiet: true,
          intent: ["living", "investment"],
        },
        activeQuestionId: "intent",
        view: "recommendation",
        focusedItemId: null,
        bookmarks: [],
        compareItemIds: [],
        recapItemIds: [],
        buyerProfileId: null,
        customer: {
          name: "Sara Haddad",
          phone: "+357 99 123 456",
          email: "sara@example.com",
          notes: "Relocating with two school-age children.",
        },
        stakeholders: [
          {
            id: "sh-demo-1",
            name: "Karim Haddad",
            role: "Co-decision maker",
            influence: "high",
            notes: "Sara's spouse — hasn't seen the shortlist yet.",
          },
        ],
        timeline: pushEvent(s.timeline, {
          kind: "demo",
          detail: "Loaded demo scenario",
        }),
        revision: s.revision + 1,
      }));
      publish();
    },

    _applyRemote: (state) =>
      set({
        ...state,
        timeline: state.timeline ?? [],
        stakeholders: state.stakeholders ?? [],
        proposalText: state.proposalText ?? null,
        proposalEngine: state.proposalEngine ?? null,
        buyerProfileId: state.buyerProfileId ?? null,
        workLocationLat: state.workLocationLat ?? null,
        workLocationLng: state.workLocationLng ?? null,
        compareItemIds: state.compareItemIds ?? [],
        recapItemIds: state.recapItemIds ?? [],
      }),

    _hydrate: () => {
      const env = bus.hydrate();
      if (env) {
        set({
          ...env.state,
          timeline: env.state.timeline ?? [],
          stakeholders: env.state.stakeholders ?? [],
          proposalText: env.state.proposalText ?? null,
          proposalEngine: env.state.proposalEngine ?? null,
          buyerProfileId: env.state.buyerProfileId ?? null,
          workLocationLat: env.state.workLocationLat ?? null,
          workLocationLng: env.state.workLocationLng ?? null,
          compareItemIds: env.state.compareItemIds ?? [],
          recapItemIds: env.state.recapItemIds ?? [],
        });
      }
    },
  };
});

/**
 * Wire the store to the bus. Call once per surface (from a client provider).
 * Returns an unsubscribe function.
 */
export function connectSessionSync(): () => void {
  const store = useSession.getState();
  store._hydrate();
  return bus.subscribe((state) => {
    useSession.getState()._applyRemote(state);
  });
}

/**
 * Join a cross-device room. The Companion (controller) publishes state to the
 * network; the Display (viewer) only receives, so it never clobbers the
 * controller's retained state. Returns a disconnect function.
 */
export function connectNetwork(params: {
  room: string;
  role: "display" | "companion";
  onStatus: (status: SyncStatus) => void;
}): () => void {
  disconnectNetwork();
  const origin = newOrigin(params.role);
  const transport = createNetworkTransport<SessionState>({
    room: params.room,
    origin,
    role: params.role,
    onRemote: (state) => useSession.getState()._applyRemote(state),
    onStatus: params.onStatus,
  });
  net =
    params.role === "companion"
      ? transport
      : // The display is a viewer: keep the live connection (presence + receive)
        // but never push session state onto the network.
        { publish: () => {}, disconnect: transport.disconnect };
  return () => disconnectNetwork();
}

export function disconnectNetwork(): void {
  net?.disconnect();
  net = null;
}

