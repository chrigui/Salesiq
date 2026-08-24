"use client";

import { useMemo, useState } from "react";
import { Search, User2 } from "lucide-react";
import { useSession } from "@/core/store/session";
import { linkBuyerProfile, useBuyerProfiles, type BuyerProfile } from "@/core/store/buyerProfiles";
import { useMeetingFlow } from "./meetingFlow";

function greetingForNow(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function StartMeetingScreen({ salespersonName }: { salespersonName: string }) {
  const session = useSession();
  const flow = useMeetingFlow();
  const { buyerProfiles } = useBuyerProfiles();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [selected, setSelected] = useState<BuyerProfile | null>(null);
  const [starting, setStarting] = useState(false);

  const matches = useMemo(() => {
    const q = name.trim().toLowerCase();
    if (!q || selected) return [];
    return buyerProfiles.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 5);
  }, [name, buyerProfiles, selected]);

  const pick = (profile: BuyerProfile) => {
    setSelected(profile);
    setName(profile.name);
    setPhone(profile.phone);
    setEmail(profile.email);
  };

  const clearSelection = () => {
    setSelected(null);
    setPhone("");
    setEmail("");
  };

  const start = async () => {
    const trimmedName = name.trim();
    if (!trimmedName || starting) return;
    setStarting(true);
    session.resetForNewMeeting();
    session.updateCustomer({ name: trimmedName, phone: phone.trim(), email: email.trim(), notes: "" });
    if (phone.trim() || email.trim()) {
      await linkBuyerProfile({ name: trimmedName, phone: phone.trim(), email: email.trim() });
    }
    setStarting(false);
    flow.goTo("meet");
  };

  return (
    <div className="bg-aurora flex min-h-screen flex-col items-center justify-center px-6 py-10">
      <div className="glass-strong w-full max-w-sm rounded-[2.2rem] p-8 ring-1 ring-white/10">
        <div className="text-xs font-semibold uppercase tracking-wide text-brand">
          {greetingForNow()}, {salespersonName.split(" ")[0]}
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-ink">Who are we meeting today?</h1>

        <div className="mt-6">
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 focus-within:border-brand/50">
            <Search className="h-4 w-4 shrink-0 text-ink-faint" />
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (selected) setSelected(null);
              }}
              placeholder="Search or enter customer name"
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint"
              autoFocus
            />
          </div>

          {matches.length > 0 && (
            <div className="mt-2 space-y-1 rounded-2xl border border-white/10 bg-white/5 p-1.5">
              {matches.map((p) => (
                <button
                  key={p.id}
                  onClick={() => pick(p)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition hover:bg-white/10"
                >
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand/15 text-brand">
                    <User2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-ink">{p.name}</div>
                    <div className="truncate text-xs text-ink-faint">Returning customer</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {selected && (
            <div className="mt-2 flex items-center justify-between rounded-xl bg-brand/10 px-3 py-2 text-xs text-brand">
              Using saved details for {selected.name}
              <button onClick={clearSelection} className="font-semibold underline underline-offset-2">
                Change
              </button>
            </div>
          )}

          {!selected && (
            <div className="mt-3 space-y-2">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number (optional)"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-brand/50"
              />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email (optional)"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-brand/50"
              />
            </div>
          )}
        </div>

        <button
          onClick={() => void start()}
          disabled={!name.trim() || starting}
          className="mt-6 w-full rounded-2xl bg-brand py-3.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
        >
          {starting ? "Starting…" : "Start meeting"}
        </button>

        <button
          onClick={() => flow.goTo("workspace")}
          className="mt-4 w-full text-center text-xs text-ink-faint underline-offset-2 hover:underline"
        >
          Skip setup
        </button>
      </div>
    </div>
  );
}
