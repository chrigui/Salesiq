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
  | "compare"
  | "item"
  | "proposal";

export interface CustomerInfo {
  name: string;
  phone: string;
  email: string;
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
  | "customer"
  | "proposal"
  | "lead"
  | "demo"
  | "reset"
  | "objection";

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
  customer: CustomerInfo;
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
  toggleBookmark: (itemId: string) => void;
  updateCustomer: (patch: Partial<CustomerInfo>) => void;
  /** Push a reviewed proposal onto the customer display and switch it into view. */
  presentProposal: (text: string, engine: string | null) => void;
  /** Record a interaction not covered by another action (proposal, lead saved…). */
  logEvent: (event: Omit<TimelineEvent, "id" | "ts">) => void;
  reset: () => void;
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
    customer: { name: "", phone: "", email: "", notes: "" },
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
    customer: s.customer,
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

    updateCustomer: (patch) => {
      // Not logged to the timeline — fires on every keystroke, would flood it.
      set((s) => ({ customer: { ...s.customer, ...patch } }));
      publish();
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
        customer: {
          name: "Sara Haddad",
          phone: "+357 99 123 456",
          email: "sara@example.com",
          notes: "Relocating with two school-age children.",
        },
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
        proposalText: state.proposalText ?? null,
        proposalEngine: state.proposalEngine ?? null,
      }),

    _hydrate: () => {
      const env = bus.hydrate();
      if (env) {
        set({
          ...env.state,
          timeline: env.state.timeline ?? [],
          proposalText: env.state.proposalText ?? null,
          proposalEngine: env.state.proposalEngine ?? null,
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

