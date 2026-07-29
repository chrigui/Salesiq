"use client";

import { useEffect, useState } from "react";

/**
 * Notification Center (Module 4 · Company Dashboard).
 *
 * A real, event-driven feed — not a mockup. Entries are created at the
 * actual moment something happens elsewhere in the product (a lead saved, a
 * deal won, a webhook delivery failing) via `notify()`, called from those
 * exact call sites: ProposalSheet.handleSaveLead, LeadManagement's status
 * change, and integrations.ts's fireWebhook. Overdue follow-ups are shown
 * separately as live "Alerts" — derived straight from lead records each
 * render rather than stored, so there's nothing to go stale or duplicate.
 */
export type NotificationKind = "lead" | "deal" | "system";

export interface Notification {
  id: string;
  kind: NotificationKind;
  title: string;
  detail: string;
  createdAt: number;
  read: boolean;
}

const KEY = "salesiq-notifications";
const EVT = "salesiq-notifications-updated";
const MAX_NOTIFICATIONS = 100;

export function getNotifications(): Notification[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as Notification[];
  } catch {
    return [];
  }
}

function saveAll(items: Notification[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(EVT));
  } catch {
    /* storage unavailable */
  }
}

export function notify(input: { kind: NotificationKind; title: string; detail: string }): void {
  if (typeof window === "undefined") return;
  const entry: Notification = {
    ...input,
    id: `notif-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: Date.now(),
    read: false,
  };
  saveAll([entry, ...getNotifications()].slice(0, MAX_NOTIFICATIONS));
}

export function markRead(id: string): void {
  saveAll(getNotifications().map((n) => (n.id === id ? { ...n, read: true } : n)));
}

export function markAllRead(): void {
  saveAll(getNotifications().map((n) => ({ ...n, read: true })));
}

export function clearNotifications(): void {
  saveAll([]);
}

/** Live notification feed — reacts to edits across tabs and in-tab. */
export function useNotifications(): Notification[] {
  const [items, setItems] = useState<Notification[]>([]);
  useEffect(() => {
    const load = () => setItems(getNotifications());
    load();
    window.addEventListener("storage", load);
    window.addEventListener(EVT, load);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener(EVT, load);
    };
  }, []);
  return items;
}

/** Unread count for the sidebar badge. */
export function useUnreadCount(): number {
  return useNotifications().filter((n) => !n.read).length;
}
