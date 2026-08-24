"use client";

import { useEffect, useState } from "react";

/**
 * The Companion's guided-journey cursor — a presentation-only concern,
 * deliberately separate from `session.ts` (which syncs to the Customer
 * Display and carries the actual recommendation state). Persisted to
 * sessionStorage so an accidental reload mid-meeting doesn't send the
 * salesperson back to square one, but a fresh tab (a new meeting) starts
 * clean. Same read/write/broadcast pattern as core/store/packs.ts and
 * core/data/customPacks.ts.
 */
export type MeetingStage = "start" | "meet" | "discover" | "confirm" | "explore" | "workspace";

export interface MeetingFlowState {
  stage: MeetingStage;
  wizardGroupIndex: number;
}

const KEY = "salesiq.companion.meetingFlow";
const EVT = "salesiq-meeting-flow-updated";

function initialState(): MeetingFlowState {
  return { stage: "start", wizardGroupIndex: 0 };
}

function readState(): MeetingFlowState {
  if (typeof window === "undefined") return initialState();
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as MeetingFlowState) : initialState();
  } catch {
    return initialState();
  }
}

function writeState(state: MeetingFlowState): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent(EVT));
  } catch {
    /* sessionStorage can be unavailable (private mode) — the flow still works for this render */
  }
}

export function useMeetingFlow() {
  const [state, setState] = useState<MeetingFlowState>(() => readState());

  useEffect(() => {
    const load = () => setState(readState());
    window.addEventListener(EVT, load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener(EVT, load);
      window.removeEventListener("storage", load);
    };
  }, []);

  const goTo = (stage: MeetingStage) => {
    const next: MeetingFlowState = { stage, wizardGroupIndex: stage === "discover" ? 0 : readState().wizardGroupIndex };
    writeState(next);
    setState(next);
  };

  const setWizardGroupIndex = (index: number) => {
    const next: MeetingFlowState = { ...readState(), wizardGroupIndex: index };
    writeState(next);
    setState(next);
  };

  const resetFlow = () => {
    writeState(initialState());
    setState(initialState());
  };

  return { ...state, goTo, setWizardGroupIndex, resetFlow };
}
