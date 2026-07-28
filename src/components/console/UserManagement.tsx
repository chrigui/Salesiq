"use client";

import { useState } from "react";
import {
  Plus,
  X,
  ShieldCheck,
  ShieldOff,
  KeyRound,
  UserX,
  UserCheck,
  Trash2,
  Mail,
  Users as UsersIcon,
} from "lucide-react";
import { Panel } from "@/components/console/light-ui";
import { cx } from "@/components/ui/primitives";
import { useBranches } from "@/core/data/branches";
import {
  ROLES,
  getUsers,
  inviteUser,
  saveUsers,
  useUsers,
  type AppUser,
  type UserRole,
} from "@/core/data/users";
import { Field, Select, TextInput } from "@/components/console/builder/fields";

const STATUS_STYLE: Record<AppUser["status"], string> = {
  active: "bg-emerald-100 text-emerald-700",
  invited: "bg-amber-100 text-amber-700",
  suspended: "bg-zinc-200 text-zinc-500",
};

function timeAgo(ts: number | null): string {
  if (ts == null) return "Never";
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 60) return "Just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

/**
 * User Management (Module 1). Invite, suspend and remove users; track role,
 * branch assignment, MFA and last login. Password reset and invite delivery
 * are simulated (confirmation toast) since no mail provider is wired up yet —
 * the action and resulting status transition are real, only the email send is
 * a stub.
 */
export function UserManagement() {
  const users = useUsers();
  const branches = useBranches();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((t) => (t === msg ? null : t)), 2200);
  };

  const update = (id: string, patch: Partial<AppUser>) =>
    saveUsers(users.map((u) => (u.id === id ? { ...u, ...patch } : u)));

  const remove = (u: AppUser) => {
    if (!confirm(`Remove ${u.name}? They will lose access immediately.`)) return;
    saveUsers(users.filter((x) => x.id !== u.id));
    flash(`${u.name} removed.`);
  };

  const toggleSuspend = (u: AppUser) => {
    const status = u.status === "suspended" ? "active" : "suspended";
    update(u.id, { status });
    flash(status === "suspended" ? `${u.name} suspended.` : `${u.name} reactivated.`);
  };

  const toggleMfa = (u: AppUser) => {
    update(u.id, { mfaEnabled: !u.mfaEnabled });
  };

  const resetPassword = (u: AppUser) => {
    flash(`Password reset link sent to ${u.email}.`);
  };

  const branchName = (id: string | null) => branches.find((b) => b.id === id)?.name ?? "—";

  const counts = {
    active: users.filter((u) => u.status === "active").length,
    invited: users.filter((u) => u.status === "invited").length,
    suspended: users.filter((u) => u.status === "suspended").length,
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-4">
        <SummaryCard icon={UsersIcon} label="Total users" value={String(users.length)} />
        <SummaryCard icon={UserCheck} label="Active" value={String(counts.active)} tone="good" />
        <SummaryCard icon={Mail} label="Pending invite" value={String(counts.invited)} tone="pending" />
        <SummaryCard icon={UserX} label="Suspended" value={String(counts.suspended)} tone="muted" />
      </div>

      <Panel
        title="Users"
        right={
          <button
            onClick={() => setInviteOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110"
          >
            <Plus className="h-4 w-4" /> Invite user
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-zinc-400">
                <th className="pb-3 font-medium">User</th>
                <th className="pb-3 font-medium">Role</th>
                <th className="pb-3 font-medium">Branch</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">MFA</th>
                <th className="pb-3 font-medium">Last login</th>
                <th className="pb-3 font-medium">Device</th>
                <th className="pb-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-zinc-100">
                  <td className="py-3">
                    <div className="font-medium text-zinc-900">{u.name}</div>
                    <div className="text-xs text-zinc-400">{u.email}</div>
                  </td>
                  <td className="py-3">
                    <Select
                      value={u.role}
                      onChange={(e) => update(u.id, { role: e.target.value as UserRole })}
                      className="w-auto py-1.5 text-xs"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </Select>
                  </td>
                  <td className="py-3 text-zinc-600">{branchName(u.branchId)}</td>
                  <td className="py-3">
                    <span className={cx("rounded-full px-2.5 py-1 text-xs font-medium capitalize", STATUS_STYLE[u.status])}>
                      {u.status}
                    </span>
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => toggleMfa(u)}
                      className={cx(
                        "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition",
                        u.mfaEnabled ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-400 hover:bg-zinc-200",
                      )}
                    >
                      {u.mfaEnabled ? <ShieldCheck className="h-3 w-3" /> : <ShieldOff className="h-3 w-3" />}
                      {u.mfaEnabled ? "On" : "Off"}
                    </button>
                  </td>
                  <td className="py-3 text-zinc-500">{timeAgo(u.lastLogin)}</td>
                  <td className="py-3 text-zinc-500">{u.device ?? "—"}</td>
                  <td className="py-3">
                    <div className="flex items-center justify-end gap-1">
                      <IconBtn label="Reset password" onClick={() => resetPassword(u)}>
                        <KeyRound className="h-3.5 w-3.5" />
                      </IconBtn>
                      <IconBtn
                        label={u.status === "suspended" ? "Reactivate" : "Suspend"}
                        onClick={() => toggleSuspend(u)}
                      >
                        {u.status === "suspended" ? (
                          <UserCheck className="h-3.5 w-3.5" />
                        ) : (
                          <UserX className="h-3.5 w-3.5" />
                        )}
                      </IconBtn>
                      <IconBtn label="Remove" onClick={() => remove(u)} danger>
                        <Trash2 className="h-3.5 w-3.5" />
                      </IconBtn>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-sm text-zinc-400">
                    No users yet. Invite someone to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      {inviteOpen && (
        <InviteModal
          branches={branches}
          onClose={() => setInviteOpen(false)}
          onInvite={(input) => {
            inviteUser(input);
            setInviteOpen(false);
            flash(`Invite sent to ${input.email}.`);
          }}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700 shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof UsersIcon;
  label: string;
  value: string;
  tone?: "good" | "pending" | "muted";
}) {
  const toneClass =
    tone === "good"
      ? "text-emerald-600"
      : tone === "pending"
        ? "text-amber-600"
        : tone === "muted"
          ? "text-zinc-400"
          : "text-zinc-900";
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className={cx("mt-2 text-2xl font-bold tracking-tight tabular-nums", toneClass)}>{value}</div>
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cx(
        "grid h-8 w-8 place-items-center rounded-lg text-zinc-400 transition hover:bg-zinc-100",
        danger ? "hover:text-rose-600" : "hover:text-zinc-700",
      )}
    >
      {children}
    </button>
  );
}

function InviteModal({
  branches,
  onClose,
  onInvite,
}: {
  branches: { id: string; name: string }[];
  onClose: () => void;
  onInvite: (input: { name: string; email: string; role: UserRole; branchId: string | null }) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("Salesperson");
  const [branchId, setBranchId] = useState<string>(branches[0]?.id ?? "");

  const valid = name.trim().length > 0 && /\S+@\S+\.\S+/.test(email);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-zinc-900">Invite user</h3>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-zinc-400 hover:bg-zinc-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3">
          <Field label="Full name">
            <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Jordan Blake" />
          </Field>
          <Field label="Email">
            <TextInput
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jordan@company.com"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Role">
              <Select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </Select>
            </Field>
            <Field label="Branch">
              <Select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </Select>
            </Field>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl border border-zinc-200 px-4 py-2 text-sm text-zinc-600 transition hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            disabled={!valid}
            onClick={() => onInvite({ name: name.trim(), email: email.trim(), role, branchId: branchId || null })}
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
          >
            Send invite
          </button>
        </div>
      </div>
    </div>
  );
}
