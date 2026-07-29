"use client";

import { useState } from "react";
import { AlertCircle, KeyRound, Lock, ShieldAlert, ShieldCheck, User2 } from "lucide-react";
import { cx } from "@/components/ui/primitives";
import { getUsers } from "@/core/data/users";
import {
  DEMO_MFA_CODE,
  DEMO_PASSWORD,
  verifyCredential,
  verifyMfaCode,
} from "@/core/data/auth";
import { SSO_PROVIDERS, useSsoSettings } from "@/core/data/ssoSettings";
import { Field, TextInput } from "@/components/console/builder/fields";

const ERROR_COPY: Record<string, string> = {
  "not-found": "No account found with that email.",
  "wrong-password": "That password isn't right.",
  suspended: "This account is suspended. Contact an admin.",
  invited: "This invite hasn't been accepted yet.",
};

/**
 * Authentication (Module 1). A real login/MFA/session flow against the
 * existing User records — see the warning in core/data/auth.ts for exactly
 * what is and isn't real here. The demo credential is shown on-screen so
 * anyone testing the pilot can sign in without guessing.
 */
export function LoginScreen({
  workspaceName,
  glyph,
  onSuccess,
}: {
  workspaceName: string;
  glyph: string;
  onSuccess: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [mfaError, setMfaError] = useState<string | null>(null);
  const sso = useSsoSettings();

  const quickAccounts = getUsers().filter((u) => u.status === "active").slice(0, 3);

  const submitCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const result = verifyCredential(email, password);
    if (!result.ok) {
      setError(ERROR_COPY[result.error] ?? "Something went wrong.");
      return;
    }
    if (result.needsMfa) {
      setPendingUserId(result.pendingUserId);
      return;
    }
    onSuccess();
  };

  const submitMfa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingUserId) return;
    const result = verifyMfaCode(pendingUserId, code);
    if (!result.ok) {
      setMfaError("That code isn't right.");
      return;
    }
    onSuccess();
  };

  return (
    <div className="console flex min-h-screen items-center justify-center bg-zinc-100 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-zinc-900 text-xl text-white">
            {glyph}
          </span>
          <div className="text-lg font-semibold text-zinc-900">{workspaceName}</div>
          <div className="text-sm text-zinc-400">Company Dashboard</div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          {pendingUserId ? (
            <form onSubmit={submitMfa} className="space-y-4">
              <div className="mb-1 flex items-center gap-2 text-zinc-900">
                <ShieldCheck className="h-4 w-4" />
                <h2 className="text-base font-semibold">Verify it&rsquo;s you</h2>
              </div>
              <p className="text-sm text-zinc-500">
                Enter the 6-digit code from your authenticator app.
              </p>
              <Field label="Authentication code">
                <TextInput
                  autoFocus
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.replace(/\D/g, ""));
                    setMfaError(null);
                  }}
                  placeholder="000000"
                  className="text-center text-lg tracking-[0.4em]"
                />
              </Field>
              {mfaError && <ErrorNote text={mfaError} />}
              <button
                type="submit"
                disabled={code.length !== 6}
                className="w-full rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
              >
                Verify &amp; sign in
              </button>
              <button
                type="button"
                onClick={() => {
                  setPendingUserId(null);
                  setCode("");
                  setMfaError(null);
                }}
                className="w-full text-center text-xs text-zinc-400 hover:text-zinc-600"
              >
                Back to sign in
              </button>
              <p className="rounded-lg bg-zinc-50 px-3 py-2 text-center text-[11px] text-zinc-400">
                Pilot demo code: <span className="font-mono text-zinc-600">{DEMO_MFA_CODE}</span>
              </p>
            </form>
          ) : (
            <form onSubmit={submitCredentials} className="space-y-4">
              {sso.enforced && sso.provider !== "none" && (
                <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                  SSO ({SSO_PROVIDERS.find((p) => p.id === sso.provider)?.label}) is required for
                  this workspace — pilot demo sign-in is still available below.
                </div>
              )}
              <Field label="Email">
                <div className="relative">
                  <User2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <TextInput
                    type="email"
                    autoFocus
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                    placeholder="you@company.com"
                    className="pl-9"
                  />
                </div>
              </Field>
              <Field label="Password">
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <TextInput
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    placeholder="••••••••"
                    className="pl-9"
                  />
                </div>
              </Field>
              {error && <ErrorNote text={error} />}
              <button
                type="submit"
                disabled={!email || !password}
                className="w-full rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
              >
                Sign in
              </button>
            </form>
          )}
        </div>

        {!pendingUserId && (
          <div className="mt-4 rounded-2xl border border-dashed border-zinc-300 bg-white/60 p-4 text-xs text-zinc-500">
            <div className="mb-2 flex items-center gap-1.5 font-medium text-zinc-600">
              <KeyRound className="h-3.5 w-3.5" /> Pilot demo — no real passwords yet
            </div>
            <p className="mb-2">
              Use password <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-zinc-700">{DEMO_PASSWORD}</span> with any account below:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {quickAccounts.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    setEmail(u.email);
                    setPassword(DEMO_PASSWORD);
                    setError(null);
                  }}
                  className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-600 transition hover:bg-zinc-200"
                >
                  {u.name} · {u.role}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ErrorNote({ text }: { text: string }) {
  return (
    <div className={cx("flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600")}>
      <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {text}
    </div>
  );
}
