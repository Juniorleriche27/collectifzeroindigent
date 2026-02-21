"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { getProfileMemberIdByAuthUser } from "@/lib/supabase/profile";
import type {
  CommuneOption,
  PrefectureOption,
  RegionOption,
} from "@/lib/backend/api";

import { submitOnboarding } from "./actions";
import type { OnboardingState } from "./actions";

type OnboardingFormProps = {
  communes?: CommuneOption[];
  defaultEmail?: string;
  disabledReason?: string;
  prefectures?: PrefectureOption[];
  regions?: RegionOption[];
};

export function OnboardingForm({
  communes = [],
  defaultEmail,
  disabledReason,
  prefectures = [],
  regions = [],
}: OnboardingFormProps) {
  const initialState: OnboardingState = { error: null };
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(submitOnboarding, initialState);
  const [regionId, setRegionId] = useState("");
  const [prefectureId, setPrefectureId] = useState("");
  const [communeId, setCommuneId] = useState("");
  const [joinMode, setJoinMode] = useState("personal");
  const [emailValue, setEmailValue] = useState(defaultEmail ?? "");
  const [runtimeDisabledReason, setRuntimeDisabledReason] = useState<string | null>(null);
  const [alreadyOnboarded, setAlreadyOnboarded] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [regionsState, setRegionsState] = useState<RegionOption[]>(regions);
  const [prefecturesState, setPrefecturesState] = useState<PrefectureOption[]>(prefectures);
  const [communesState, setCommunesState] = useState<CommuneOption[]>(communes);

  useEffect(() => {
    let active = true;

    async function loadOnboardingDependencies() {
      try {
        const supabase = createClient();

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }
        if (!user) {
          router.replace("/login?next=%2Fonboarding");
          return;
        }

        if (user.email) {
          setEmailValue((previous) => previous || user.email || "");
        }

        const [profileLookup, regionsResult, prefecturesResult, communesResult] = await Promise.all(
          [
            getProfileMemberIdByAuthUser(supabase, user.id),
            supabase.from("region").select("id, name").order("name"),
            supabase.from("prefecture").select("id, name, region_id").order("name"),
            supabase.from("commune").select("id, name, prefecture_id").order("name"),
          ],
        );

        if (!active) return;

        if (profileLookup.error) {
          console.error("Unable to verify linked member from profile", profileLookup.error);
        } else if (profileLookup.memberId) {
          setAlreadyOnboarded(true);
          setRuntimeDisabledReason(
            "Votre profil est deja complete. Ouvrez directement le dashboard.",
          );
          return;
        }

        if (regionsResult.error) throw regionsResult.error;
        if (prefecturesResult.error) throw prefecturesResult.error;
        if (communesResult.error) throw communesResult.error;

        const nextRegions = regionsResult.data ?? [];
        const nextPrefectures = prefecturesResult.data ?? [];
        const nextCommunes = communesResult.data ?? [];

        setRegionsState(nextRegions);
        setPrefecturesState(nextPrefectures);
        setCommunesState(nextCommunes);

        if (
          nextRegions.length === 0 ||
          nextPrefectures.length === 0 ||
          nextCommunes.length === 0
        ) {
          setRuntimeDisabledReason(
            "Configuration territoriale incomplete (region/prefecture/commune). Ajoutez ces donnees dans Supabase avant de terminer l'onboarding.",
          );
        } else {
          setRuntimeDisabledReason(null);
        }
      } catch (error) {
        console.error("Unable to load onboarding dependencies", error);
        if (active) {
          setRuntimeDisabledReason(
            "Impossible de charger region/prefecture/commune pour le moment.",
          );
        }
      } finally {
        if (active) {
          setLoadingLocations(false);
        }
      }
    }

    loadOnboardingDependencies();
    return () => {
      active = false;
    };
  }, [router]);

  const filteredPrefectures = useMemo(
    () => prefecturesState.filter((prefecture) => String(prefecture.region_id) === regionId),
    [prefecturesState, regionId],
  );
  const prefectureIdsInRegion = useMemo(
    () => new Set(filteredPrefectures.map((prefecture) => String(prefecture.id))),
    [filteredPrefectures],
  );

  const filteredCommunes = useMemo(
    () => {
      if (prefectureId) {
        return communesState.filter((commune) => String(commune.prefecture_id) === prefectureId);
      }
      if (!regionId) return [];
      return communesState.filter((commune) =>
        prefectureIdsInRegion.has(String(commune.prefecture_id)),
      );
    },
    [communesState, prefectureId, prefectureIdsInRegion, regionId],
  );

  const effectiveDisabledReason = disabledReason ?? runtimeDisabledReason;
  const formDisabled = isPending || loadingLocations || Boolean(effectiveDisabledReason);

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
          id="email-optional"
          name="email"
          onChange={(event) => setEmailValue(event.target.value)}
          value={emailValue}
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
          {regionsState.map((region) => (
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
          Nom de votre association/entreprise
        </label>
        <Input
          id="org-name"
          name="org_name"
          placeholder="Ex: Association CZI Jeunes / Entreprise CZI SARL"
          disabled={joinMode === "personal"}
          required={joinMode !== "personal"}
        />
      </div>

      {loadingLocations ? (
        <p className="md:col-span-2 text-sm text-muted-foreground">Chargement des donnees...</p>
      ) : null}
      {effectiveDisabledReason ? (
        <p className="md:col-span-2 text-sm text-amber-700">{effectiveDisabledReason}</p>
      ) : null}
      {alreadyOnboarded ? (
        <p className="md:col-span-2 text-sm text-primary">
          <Link className="font-semibold underline" href="/app/dashboard">
            Aller au dashboard
          </Link>
        </p>
      ) : null}
      {state.error ? <p className="md:col-span-2 text-sm text-red-600">{state.error}</p> : null}

      <div className="md:col-span-2">
        <Button size="lg" type="submit" disabled={formDisabled}>
          {isPending ? "Creation en cours..." : "Terminer l'onboarding"}
        </Button>
      </div>
    </form>
  );
}
