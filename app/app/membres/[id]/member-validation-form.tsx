"use client";

import { useActionState, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { MemberRecord } from "@/lib/backend/api";

import { validateMember } from "./actions";
import type { MemberValidationState } from "./actions";

type MemberValidationFormProps = {
  member: MemberRecord;
};

function formatDateTime(value?: string | null): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

export function MemberValidationForm({ member }: MemberValidationFormProps) {
  const initialValidationState: MemberValidationState = {
    error: null,
    success: null,
  };
  const [decision, setDecision] = useState<"approve" | "reject">("approve");
  const validateMemberAction = validateMember.bind(null, String(member.id));
  const [state, formAction, isPending] = useActionState(
    validateMemberAction,
    initialValidationState,
  );
  const defaultPrimary = useMemo(() => {
    if (member.cellule_primary === "entrepreneur" || member.cellule_primary === "org_leader") {
      return member.cellule_primary;
    }
    return "engaged";
  }, [member.cellule_primary]);
  const defaultSecondary = useMemo(() => {
    if (member.cellule_secondary === "engaged") return "engaged";
    if (member.cellule_secondary === "entrepreneur") return "entrepreneur";
    if (member.cellule_secondary === "org_leader") return "org_leader";
    return "";
  }, [member.cellule_secondary]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Derniere decision: {member.status ?? "unknown"} | Date: {formatDateTime(member.validated_at)}{" "}
        | Motif: {member.validation_reason ?? "-"}
      </p>
      <form className="grid gap-4 md:grid-cols-2" action={formAction}>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="validation-decision">
            Decision
          </label>
          <Select
            id="validation-decision"
            name="decision"
            value={decision}
            onChange={(event) => setDecision(event.target.value as "approve" | "reject")}
            required
          >
            <option value="approve">Approuver (active)</option>
            <option value="reject">Rejeter</option>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="validation-cellule-primary">
            Cellule primaire
          </label>
          <Select
            defaultValue={defaultPrimary}
            id="validation-cellule-primary"
            name="cellule_primary"
            required
          >
            <option value="engaged">Engage</option>
            <option value="entrepreneur">Entrepreneur</option>
            <option value="org_leader">Leader organisation</option>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="validation-cellule-secondary">
            Cellule secondaire (optionnel)
          </label>
          <Select
            defaultValue={defaultSecondary}
            id="validation-cellule-secondary"
            name="cellule_secondary"
          >
            <option value="">Aucune</option>
            <option value="engaged">Engage</option>
            <option value="entrepreneur">Entrepreneur</option>
            <option value="org_leader">Leader organisation</option>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="validation-reason">
            Motif {decision === "reject" ? "(obligatoire)" : "(optionnel)"}
          </label>
          <Input
            defaultValue={member.validation_reason ?? ""}
            id="validation-reason"
            maxLength={500}
            name="reason"
            placeholder={
              decision === "reject"
                ? "Motif obligatoire du rejet"
                : "Commentaire optionnel de validation"
            }
            required={decision === "reject"}
          />
        </div>

        {state.error ? <p className="md:col-span-2 text-sm text-red-600">{state.error}</p> : null}
        {state.success ? (
          <p className="md:col-span-2 text-sm text-emerald-700">{state.success}</p>
        ) : null}

        <div className="md:col-span-2">
          <Button type="submit" disabled={isPending}>
            {isPending
              ? "Traitement..."
              : decision === "approve"
                ? "Approuver le membre"
                : "Rejeter le membre"}
          </Button>
        </div>
      </form>
    </div>
  );
}
