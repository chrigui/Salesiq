"use client";

import { useState } from "react";
import { Check, Lock, RotateCcw } from "lucide-react";
import { Panel } from "@/components/console/light-ui";
import { cx } from "@/components/ui/primitives";
import { ROLES, type UserRole } from "@/core/data/users";
import {
  CAPABILITIES,
  getPermissionMatrix,
  resetPermissionMatrix,
  savePermissionMatrix,
  usePermissionMatrix,
} from "@/core/data/permissions";

/**
 * Role & Permission Engine (Module 1). A granular capability matrix — every
 * action in the product mapped against every role. Owner is always fully
 * granted and its column is locked, guaranteeing there is always at least one
 * role with complete access (no lockout scenario).
 */
export function PermissionsEditor() {
  const matrix = usePermissionMatrix();
  const [savedFlash, setSavedFlash] = useState(false);

  const flash = () => {
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1000);
  };

  const toggle = (role: UserRole, capId: string) => {
    if (role === "Owner") return;
    const next = getPermissionMatrix();
    next[role] = { ...next[role], [capId]: !next[role][capId] };
    savePermissionMatrix(next);
    flash();
  };

  const groups = Array.from(new Set(CAPABILITIES.map((c) => c.group)));

  return (
    <div className="space-y-4">
      <Panel
        title="Permission matrix"
        right={
          <div className="flex items-center gap-3">
            <span
              className={cx(
                "inline-flex items-center gap-1 text-xs text-emerald-600 transition-opacity",
                savedFlash ? "opacity-100" : "opacity-0",
              )}
            >
              <Check className="h-3.5 w-3.5" /> Saved
            </span>
            <button
              onClick={() => {
                if (confirm("Reset all roles to their default permissions?")) resetPermissionMatrix();
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-1.5 text-xs text-zinc-600 transition hover:bg-zinc-50"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset to defaults
            </button>
          </div>
        }
      >
        <p className="mb-4 text-sm text-zinc-500">
          Click a cell to grant or revoke a capability for that role.{" "}
          <span className="inline-flex items-center gap-1 text-zinc-400">
            <Lock className="h-3 w-3" /> Owner
          </span>{" "}
          always has full access and can&rsquo;t be edited.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-zinc-400">
                <th className="w-64 pb-3 font-medium">Capability</th>
                {ROLES.map((role) => (
                  <th key={role} className="pb-3 text-center font-medium">
                    <span className="inline-flex items-center gap-1">
                      {role}
                      {role === "Owner" && <Lock className="h-3 w-3" />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <GroupRows
                  key={group}
                  group={group}
                  matrix={matrix}
                  onToggle={toggle}
                />
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function GroupRows({
  group,
  matrix,
  onToggle,
}: {
  group: string;
  matrix: ReturnType<typeof usePermissionMatrix>;
  onToggle: (role: UserRole, capId: string) => void;
}) {
  const caps = CAPABILITIES.filter((c) => c.group === group);
  return (
    <>
      <tr>
        <td colSpan={ROLES.length + 1} className="pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
          {group}
        </td>
      </tr>
      {caps.map((cap) => (
        <tr key={cap.id} className="border-t border-zinc-100">
          <td className="py-2.5 text-zinc-700">{cap.label}</td>
          {ROLES.map((role) => {
            const granted = matrix[role]?.[cap.id] ?? false;
            const locked = role === "Owner";
            return (
              <td key={role} className="py-2.5 text-center">
                <button
                  disabled={locked}
                  onClick={() => onToggle(role, cap.id)}
                  aria-label={`${granted ? "Revoke" : "Grant"} ${cap.label} for ${role}`}
                  className={cx(
                    "mx-auto grid h-6 w-6 place-items-center rounded-md border transition",
                    locked
                      ? "cursor-default border-zinc-200 bg-zinc-100"
                      : granted
                        ? "border-zinc-900 bg-zinc-900 hover:brightness-110"
                        : "border-zinc-200 bg-white hover:border-zinc-300",
                  )}
                >
                  {granted && (
                    <Check className={cx("h-3.5 w-3.5", locked ? "text-zinc-400" : "text-white")} />
                  )}
                </button>
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}
