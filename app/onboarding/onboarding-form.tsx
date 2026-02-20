"use client";

import { useActionState, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type {
  CommuneOption,
  PrefectureOption,
  RegionOption,
} from "@/lib/backend/api";

import { initialState, submitOnboarding } from "./actions";

type OnboardingFormProps = {
  communes: CommuneOption[];
  defaultEmail?: string;
  disabledReason?: string;
  prefectures: PrefectureOption[];
  regions: RegionOption[];
};

export function OnboardingForm({
  communes,
  defaultEmail,
  disabledReason,
  prefectures,
  regions,
}: OnboardingFormProps) {
  const [state, formAction, isPending] = useActionState(submitOnboarding, initialState);
  const [regionId, setRegionId] = useState("");
  const [prefectureId, setPrefectureId] = useState("");
  const [communeId, setCommuneId] = useState("");
  const [joinMode, setJoinMode] = useState("personal");

  const filteredPrefectures = useMemo(
    () => prefectures.filter((prefecture) => String(prefecture.region_id) === regionId),
    [prefectures, regionId],
  );
  const prefectureIdsInRegion = useMemo(
    () => new Set(filteredPrefectures.map((prefecture) => String(prefecture.id))),
    [filteredPrefectures],
  );

  const filteredCommunes = useMemo(
    () => {
      if (prefectureId) {
        return communes.filter((commune) => String(commune.prefecture_id) === prefectureId);
      }
      if (!regionId) return [];
      return communes.filter((commune) =>
        prefectureIdsInRegion.has(String(commune.prefecture_id)),
      );
    },
    [communes, prefectureId, prefectureIdsInRegion, regionId],
  );

  const formDisabled = isPending || Boolean(disabledReason);

  return (
    <form className="mt-8 grid gap-4 md:grid-cols-2" action={formAction}>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="first-name">
          Prenom
        </label>
        <Input id="first-name" name="first_name" placeholder="Ex: Afiwa" required />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="last-name">
          Nom
        </label>
        <Input id="last-name" name="last_name" placeholder="Ex: Mensah" required />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="phone">
          Telephone
        </label>
        <Input id="phone" name="phone" placeholder="+228 90 00 00 00" required />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="email-optional">
          Email (optionnel)
        </label>
        <Input
          defaultValue={defaultEmail}
          id="email-optional"
          name="email"
          type="email"
          placeholder="vous@exemple.com"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="region">
          Region
        </label>
        <Select
          id="region"
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
        <label className="text-sm font-medium" htmlFor="prefecture">
          Prefecture
        </label>
        <Select
          id="prefecture"
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
        <label className="text-sm font-medium" htmlFor="commune">
          Commune
        </label>
        <Select
          id="commune"
          name="commune_id"
          value={communeId}
          onChange={(event) => setCommuneId(event.target.value)}
          disabled={!regionId || filteredCommunes.length === 0}
          required
        >
          <option value="" disabled>
            {regionId ? "Selectionner une commune" : "Selectionner d'abord une region"}
          </option>
          {filteredCommunes.map((commune) => (
            <option key={commune.id} value={commune.id}>
              {commune.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="join-mode-onboarding">
          Type d&apos;inscription
        </label>
        <Select
          id="join-mode-onboarding"
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
      <div className="space-y-2 md:col-span-2">
        <label className="text-sm font-medium" htmlFor="org-name">
          Nom organisation (si association/enterprise)
        </label>
        <Input
          id="org-name"
          name="org_name"
          placeholder="Nom de l'organisation"
          required={joinMode !== "personal"}
        />
      </div>

      {disabledReason ? <p className="md:col-span-2 text-sm text-amber-700">{disabledReason}</p> : null}
      {state.error ? <p className="md:col-span-2 text-sm text-red-600">{state.error}</p> : null}

      <div className="md:col-span-2">
        <Button size="lg" type="submit" disabled={formDisabled}>
          {isPending ? "Creation en cours..." : "Terminer l'onboarding"}
        </Button>
      </div>
    </form>
  );
}
