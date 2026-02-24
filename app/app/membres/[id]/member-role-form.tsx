"use client";

import { useActionState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { OWNER_ADMIN_EMAIL } from "@/lib/constants/governance";

import { updateMemberRole } from "./actions";
import type { MemberRoleState } from "./actions";

type MemberRoleFormProps = {
  actorRole: string;
  currentRole: string | null;
  memberId: string;
  targetEmail: string | null;
  targetUserId: string;
};

type RoleOption = {
  label: string;
  value: string;
};

const roleLabels: Record<string, string> = {
  admin: "Admin",
  ca: "CA",
  cn: "CN",
  member: "Member",
  pf: "PF",
};

const adminOptions: RoleOption[] = [
  { label: "Member", value: "member" },
  { label: "PF", value: "pf" },
  { label: "CN", value: "cn" },
  { label: "CA", value: "ca" },
  { label: "Admin", value: "admin" },
];

const caOptions: RoleOption[] = [
  { label: "Member", value: "member" },
  { label: "PF", value: "pf" },
  { label: "CN", value: "cn" },
];

function normalizeRole(value: string | null): string {
  const normalized = (value ?? "member").trim().toLowerCase();
  if (!normalized) return "member";
  return normalized;
}

function optionsForActor(role: string): RoleOption[] {
  if (role === "admin") return adminOptions;
  if (role === "ca") return caOptions;
  return [];
}

export function MemberRoleForm({
  actorRole,
  currentRole,
  memberId,
  targetEmail,
  targetUserId,
}: MemberRoleFormProps) {
  const normalizedActorRole = normalizeRole(actorRole);
  const normalizedCurrentRole = normalizeRole(currentRole);
  const roleOptions = optionsForActor(normalizedActorRole);
  const canEditRole = roleOptions.length > 0;
  const safeTargetUserId = targetUserId || "__missing_target_user_id__";

  const normalizedTargetEmail = (targetEmail ?? "").trim().toLowerCase();
  const isOwnerProtected = normalizedTargetEmail === OWNER_ADMIN_EMAIL;
  const initialRoleState: MemberRoleState = {
    error: null,
    success: null,
  };
  const updateMemberRoleAction = updateMemberRole.bind(
    null,
    memberId,
    safeTargetUserId,
    normalizedTargetEmail || null,
  );
  const [state, formAction, isPending] = useActionState(
    updateMemberRoleAction,
    initialRoleState,
  );

  if (!targetUserId) {
    return <p className="text-sm text-red-600">Impossible de resoudre le compte utilisateur cible.</p>;
  }

  if (!canEditRole) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted">
          Role actuel: <Badge>{roleLabels[normalizedCurrentRole] ?? normalizedCurrentRole}</Badge>
        </p>
        <p className="text-sm text-muted">
          Ce role ne permet pas de modifier les roles gouvernance.
        </p>
      </div>
    );
  }

  if (isOwnerProtected) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted">
          Role actuel: <Badge>{roleLabels[normalizedCurrentRole] ?? normalizedCurrentRole}</Badge>
        </p>
        <p className="text-sm text-muted">
          Compte proprietaire technique (`{OWNER_ADMIN_EMAIL}`): role admin verrouille en interface.
        </p>
      </div>
    );
  }

  return (
    <form className="grid gap-3 md:max-w-sm" action={formAction}>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="member-role">
          Role du membre
        </label>
        <Select defaultValue={normalizedCurrentRole} id="member-role" name="role" required>
          {roleOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-700">{state.success}</p> : null}

      <div>
        <Button type="submit" variant="secondary" disabled={isPending}>
          {isPending ? "Mise a jour..." : "Mettre a jour le role"}
        </Button>
      </div>
    </form>
  );
}
