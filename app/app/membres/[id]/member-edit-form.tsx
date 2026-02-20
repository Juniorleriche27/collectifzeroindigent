"use client";

import { useActionState, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type {
  CommuneOption,
  MemberRecord,
  PrefectureOption,
  RegionOption,
} from "@/lib/backend/api";

import { initialMemberUpdateState, updateMember } from "./actions";

type MemberEditFormProps = {
  communes: CommuneOption[];
  member: MemberRecord;
  prefectures: PrefectureOption[];
  regions: RegionOption[];
};

export function MemberEditForm({
  communes,
  member,
  prefectures,
  regions,
}: MemberEditFormProps) {
  const [regionId, setRegionId] = useState(String(member.region_id ?? ""));
  const [prefectureId, setPrefectureId] = useState(String(member.prefecture_id ?? ""));
  const [communeId, setCommuneId] = useState(String(member.commune_id ?? ""));
  const [joinMode, setJoinMode] = useState(member.join_mode ?? "personal");

  const filteredPrefectures = useMemo(
    () => prefectures.filter((prefecture) => String(prefecture.region_id) === regionId),
    [prefectures, regionId],
  );
  const filteredCommunes = useMemo(
    () => communes.filter((commune) => String(commune.prefecture_id) === prefectureId),
    [communes, prefectureId],
  );

  const updateMemberAction = updateMember.bind(null, String(member.id));
  const [state, formAction, isPending] = useActionState(
    updateMemberAction,
    initialMemberUpdateState,
  );

  return (
    <form className="grid gap-4 md:grid-cols-2" action={formAction}>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="member-first-name">
          Prenom
        </label>
        <Input
          defaultValue={member.first_name ?? ""}
          id="member-first-name"
          name="first_name"
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="member-last-name">
          Nom
        </label>
        <Input
          defaultValue={member.last_name ?? ""}
          id="member-last-name"
          name="last_name"
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="member-phone">
          Telephone
        </label>
        <Input defaultValue={member.phone ?? ""} id="member-phone" name="phone" required />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="member-email">
          Email (optionnel)
        </label>
        <Input defaultValue={member.email ?? ""} id="member-email" name="email" type="email" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="member-status">
          Status
        </label>
        <Select id="member-status" name="status" defaultValue={member.status ?? "active"} required>
          <option value="active">Actif</option>
          <option value="pending">En attente</option>
          <option value="suspended">Suspendu</option>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="member-join-mode">
          Type d&apos;inscription
        </label>
        <Select
          id="member-join-mode"
          name="join_mode"
          value={joinMode}
          onChange={(event) => setJoinMode(event.target.value)}
          required
        >
          <option value="personal">Personal</option>
          <option value="association">Association</option>
          <option value="enterprise">Enterprise</option>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="member-region">
          Region
        </label>
        <Select
          id="member-region"
          name="region_id"
          value={regionId}
          onChange={(event) => {
            setRegionId(event.target.value);
            setPrefectureId("");
            setCommuneId("");
          }}
          required
        >
          <option value="" disabled>
            Selectionner une region
          </option>
          {regions.map((region) => (
            <option key={region.id} value={region.id}>
              {region.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="member-prefecture">
          Prefecture
        </label>
        <Select
          id="member-prefecture"
          name="prefecture_id"
          value={prefectureId}
          onChange={(event) => {
            setPrefectureId(event.target.value);
            setCommuneId("");
          }}
          disabled={!regionId}
          required
        >
          <option value="" disabled>
            Selectionner une prefecture
          </option>
          {filteredPrefectures.map((prefecture) => (
            <option key={prefecture.id} value={prefecture.id}>
              {prefecture.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="member-commune">
          Commune
        </label>
        <Select
          id="member-commune"
          name="commune_id"
          value={communeId}
          onChange={(event) => setCommuneId(event.target.value)}
          disabled={!prefectureId}
          required
        >
          <option value="" disabled>
            Selectionner une commune
          </option>
          {filteredCommunes.map((commune) => (
            <option key={commune.id} value={commune.id}>
              {commune.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="member-org-name">
          Nom organisation (si association/enterprise)
        </label>
        <Input
          defaultValue={member.org_name ?? ""}
          id="member-org-name"
          name="org_name"
          required={joinMode !== "personal"}
        />
      </div>

      {state.error ? <p className="md:col-span-2 text-sm text-red-600">{state.error}</p> : null}
      {state.success ? (
        <p className="md:col-span-2 text-sm text-emerald-700">{state.success}</p>
      ) : null}

      <div className="md:col-span-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}
