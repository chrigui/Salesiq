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
  | "item";

export interface CustomerInfo {
  name: string;
  phone: string;
  email: string;
  notes: string;
}

/** The full, serialisable session state shared across surfaces. */
export interface SessionState {
  packId: string;
  answers: Answers;
  activeQuestionId: string | null;
  view: DisplayView;
  focusedItemId: string | null;
  bookmarks: string[];
  customer: CustomerInfo;
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
  reset: () => void;
  /** Load a compelling, pre-filled scenario for a clean live demo. */
  loadDemo: () => void;
  /** Apply a full state received from another surface (no re-broadcast). */
  _applyRemote: (state: SessionState) => void;
  _hydrate: () => void;
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
      }),

    answer: (questionId, value) => {
      set((s) => ({
        answers: { ...s.answers, [questionId]: value },
        activeQuestionId: questionId,
        view: "question",
        revision: s.revision + 1,
      }));
      publish();
    },

    clearAnswer: (questionId) => {
      set((s) => {
        const next = { ...s.answers };
        delete next[questionId];
        return { answers: next, revision: s.revision + 1 };
      });
      publish();
    },

    setActiveQuestion: (questionId) =>
      bump({ activeQuestionId: questionId, view: "question" }),

    setView: (view) => bump({ view }),

    focusItem: (itemId) =>
      bump({ focusedItemId: itemId, view: itemId ? "item" : "recommendation" }),

    toggleBookmark: (itemId) => {
      set((s) => ({
        bookmarks: s.bookmarks.includes(itemId)
          ? s.bookmarks.filter((b) => b !== itemId)
          : [...s.bookmarks, itemId],
        revision: s.revision + 1,
      }));
      publish();
    },

    updateCustomer: (patch) => {
      set((s) => ({ customer: { ...s.customer, ...patch } }));
      publish();
    },

    reset: () => {
      set({ ...initialState() });
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
        revision: s.revision + 1,
      }));
      publish();
    },

    _applyRemote: (state) => set({ ...state }),

    _hydrate: () => {
      const env = bus.hydrate();
      if (env) set({ ...env.state });
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

