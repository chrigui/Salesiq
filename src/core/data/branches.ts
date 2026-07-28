"use client";

import { useEffect, useState } from "react";
import { type WorkingHours } from "./organization";

/**
 * Branch records — Module 1 · Platform Foundation.
 *
 * A branch is a physical location under an organization. Team, inventory and
 * devices will link to a branch as those modules land; for the pilot the branch
 * carries its own profile plus lightweight counts. Same localStorage seam as
 * the organization store — swaps to a `branches` table later unchanged.
 */
export interface Branch {
  id: string;
  name: string;
  code: string;
  address: string;
  lat: number | undefined;
  lng: number | undefined;
  phone: string;
  status: "active" | "inactive";
  workingHours: WorkingHours;
  teamSize: number;
  displays: number;
  companions: number;
}

const KEY = "salesiq-branches";
const EVT = "salesiq-branches-updated";

const DEFAULTS: Branch[] = [
  {
    id: "br-larnaca",
    name: "Larnaca HQ",
    code: "LCA",
    address: "Finikoudes Ave, Larnaca, Cyprus",
    lat: 34.9182,
    lng: 33.6362,
    phone: "+357 24 000 000",
    status: "active",
    workingHours: { days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], open: "09:00", close: "18:00" },
    teamSize: 12,
    displays: 3,
    companions: 8,
  },
  {
    id: "br-limassol",
    name: "Limassol Marina",
    code: "LIM",
    address: "Marina District, Limassol, Cyprus",
    lat: 34.6786,
    lng: 33.0413,
    phone: "+357 25 000 000",
    status: "active",
    workingHours: { days: ["Mon", "Tue", "Wed", "Thu", "Fri"], open: "09:00", close: "19:00" },
    teamSize: 7,
    displays: 2,
    companions: 5,
  },
  {
    id: "br-paphos",
    name: "Paphos Hills",
    code: "PFO",
    address: "Coral Bay Rd, Paphos, Cyprus",
    lat: 34.7754,
    lng: 32.4245,
    phone: "+357 26 000 000",
    status: "inactive",
    workingHours: { days: ["Mon", "Tue", "Wed", "Thu", "Fri"], open: "10:00", close: "17:00" },
    teamSize: 3,
    displays: 1,
    companions: 2,
  },
];

export function getBranches(): Branch[] {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    return JSON.parse(raw) as Branch[];
  } catch {
    return DEFAULTS;
  }
}

export function saveBranches(branches: Branch[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(branches));
    window.dispatchEvent(new CustomEvent(EVT));
  } catch {
    /* storage unavailable */
  }
}

export function newBranch(): Branch {
  return {
    id: `br-${Math.random().toString(36).slice(2, 8)}`,
    name: "New branch",
    code: "",
    address: "",
    lat: undefined,
    lng: undefined,
    phone: "",
    status: "active",
    workingHours: { days: ["Mon", "Tue", "Wed", "Thu", "Fri"], open: "09:00", close: "18:00" },
    teamSize: 0,
    displays: 0,
    companions: 0,
  };
}

/** Live branch list — reacts to edits across tabs and in-tab. */
export function useBranches(): Branch[] {
  const [branches, setBranches] = useState<Branch[]>([]);
  useEffect(() => {
    const load = () => setBranches(getBranches());
    load();
    window.addEventListener("storage", load);
    window.addEventListener(EVT, load);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener(EVT, load);
    };
  }, []);
  return branches;
}
