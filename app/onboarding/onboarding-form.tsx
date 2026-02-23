"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { getProfileMemberIdByAuthUser } from "@/lib/supabase/profile";
import type { CommuneOption, PrefectureOption, RegionOption } from "@/lib/backend/api";

import { submitOnboarding } from "./actions";
import type { OnboardingState } from "./actions";

type OnboardingFormProps = {
  communes?: CommuneOption[];
  defaultEmail?: string;
  disabledReason?: string;
  prefectures?: PrefectureOption[];
  regions?: RegionOption[];
};

const engagementDomainOptions = [
  "Action communautaire",
  "Education civique",
  "Environnement",
  "Sante communautaire",
  "Entrepreneuriat social",
];

const businessNeedsOptions = [
  "Mentorat",
  "Formation",
  "Financement",
  "Reseautage",
  "Accompagnement juridique",
];

const supportTypeOptions = [
  "Mentorat",
  "Formation",
  "Mise en relation",
  "Financement",
  "Visibilite",
  "Coaching projet",
];

const oddOptions = [1, 2, 3, 4, 5, 6, 8, 13, 16];

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
  const [cellulePrimary, setCellulePrimary] = useState<"engaged" | "entrepreneur" | "org_leader">(
    "engaged",
  );
  const [partnerRequest, setPartnerRequest] = useState(false);
  const [mobility, setMobility] = useState(false);
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

        if (nextRegions.length === 0 || nextPrefectures.length === 0 || nextCommunes.length === 0) {
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

  const filteredCommunes = useMemo(() => {
    if (prefectureId) {
      return communesState.filter((commune) => String(commune.prefecture_id) === prefectureId);
    }
    if (!regionId) return [];
    return communesState.filter((commune) =>
      prefectureIdsInRegion.has(String(commune.prefecture_id)),
    );
  }, [communesState, prefectureId, prefectureIdsInRegion, regionId]);

  const effectiveDisabledReason = disabledReason ?? runtimeDisabledReason;
  const formDisabled = isPending || loadingLocations || Boolean(effectiveDisabledReason);

  const requiresOrgName = joinMode !== "personal" || partnerRequest;
  const isEngaged = cellulePrimary === "engaged";
  const isEntrepreneur = cellulePrimary === "entrepreneur";
  const isOrgLeader = cellulePrimary === "org_leader";

  return (
    <form className="mt-8 grid gap-6" action={formAction}>
      <section className="rounded-xl border border-border bg-surface p-4">
        <h3 className="text-base font-semibold">A. Identite et contact</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
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
            <label className="text-sm font-medium" htmlFor="gender">
              Genre (optionnel)
            </label>
            <Select id="gender" name="gender" defaultValue="">
              <option value="">Selectionner</option>
              <option value="male">Homme</option>
              <option value="female">Femme</option>
              <option value="other">Autre</option>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="birth-date">
              Date de naissance
            </label>
            <Input id="birth-date" name="birth_date" type="date" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="age-range">
              Tranche d&apos;age (si pas de date)
            </label>
            <Select id="age-range" name="age_range" defaultValue="">
              <option value="">Selectionner</option>
              <option value="15-19">15-19</option>
              <option value="20-24">20-24</option>
              <option value="25-29">25-29</option>
              <option value="30-35">30-35</option>
              <option value="36+">36+</option>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="education-level">
              Niveau d&apos;education
            </label>
            <Select id="education-level" name="education_level" defaultValue="" required>
              <option value="" disabled>
                Selectionner
              </option>
              <option value="primaire">Primaire</option>
              <option value="secondaire">Secondaire</option>
              <option value="universitaire">Universitaire</option>
              <option value="formation_pro">Formation pro</option>
              <option value="autodidacte">Autodidacte</option>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="occupation-status">
              Statut professionnel
            </label>
            <Select id="occupation-status" name="occupation_status" defaultValue="" required>
              <option value="" disabled>
                Selectionner
              </option>
              <option value="etudiant">Etudiant</option>
              <option value="salarie">Salarie</option>
              <option value="independant">Independant</option>
              <option value="entrepreneur">Entrepreneur</option>
              <option value="recherche">En recherche</option>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium" htmlFor="profession-title">
              Titre professionnel (optionnel)
            </label>
            <Input
              id="profession-title"
              name="profession_title"
              placeholder="Ex: Charge de projet, Developpeur, Artisane"
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface p-4">
        <h3 className="text-base font-semibold">B. Localisation</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
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
            <label className="text-sm font-medium" htmlFor="locality">
              Quartier/Localite (optionnel)
            </label>
            <Input id="locality" name="locality" placeholder="Ex: Adidogome" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="inline-flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                name="mobility"
                checked={mobility}
                onChange={(event) => setMobility(event.target.checked)}
              />
              Disponible pour activites hors commune
            </label>
            <Input
              id="mobility-zones"
              name="mobility_zones"
              placeholder="Zones de mobilite (optionnel)"
              disabled={!mobility}
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface p-4">
        <h3 className="text-base font-semibold">C. Profil CZI</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="join-mode-onboarding">
              Type d&apos;inscription
            </label>
            <Select
              id="join-mode-onboarding"
              name="join_mode"
              value={joinMode}
              onChange={(event) => {
                const mode = event.target.value;
                setJoinMode(mode);
                if (mode === "enterprise") {
                  setCellulePrimary("entrepreneur");
                } else if (mode === "association") {
                  setCellulePrimary("org_leader");
                } else {
                  setCellulePrimary("engaged");
                }
              }}
              required
            >
              <option value="personal">Personal</option>
              <option value="association">Association</option>
              <option value="enterprise">Enterprise</option>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="cellule-primary">
              Cellule principale
            </label>
            <Select
              id="cellule-primary"
              name="cellule_primary"
              value={cellulePrimary}
              onChange={(event) =>
                setCellulePrimary(event.target.value as "engaged" | "entrepreneur" | "org_leader")
              }
              required
            >
              <option value="engaged">Jeune engage</option>
              <option value="entrepreneur">Jeune entrepreneur</option>
              <option value="org_leader">Responsable organisation</option>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="cellule-secondary">
              Cellule secondaire (optionnel)
            </label>
            <Select id="cellule-secondary" name="cellule_secondary" defaultValue="">
              <option value="">Aucune</option>
              <option value="engaged">Jeune engage</option>
              <option value="entrepreneur">Jeune entrepreneur</option>
              <option value="org_leader">Responsable organisation</option>
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
              disabled={!requiresOrgName}
              required={requiresOrgName}
            />
          </div>

          {isEngaged ? (
            <>
              <div className="space-y-2 md:col-span-2">
                <p className="text-sm font-medium">Domaines d&apos;engagement</p>
                <div className="grid gap-2 md:grid-cols-2">
                  {engagementDomainOptions.map((option) => (
                    <label key={option} className="inline-flex items-center gap-2 text-sm">
                      <input type="checkbox" name="engagement_domains" value={option} />
                      {option}
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="engagement-frequency">
                  Frequence d&apos;engagement
                </label>
                <Select id="engagement-frequency" name="engagement_frequency" defaultValue="">
                  <option value="" disabled>
                    Selectionner
                  </option>
                  <option value="hebdomadaire">Hebdomadaire</option>
                  <option value="mensuelle">Mensuelle</option>
                  <option value="ponctuelle">Ponctuelle</option>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="engagement-recent-action">
                  Action recente
                </label>
                <textarea
                  id="engagement-recent-action"
                  name="engagement_recent_action"
                  className="min-h-24 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/20"
                  placeholder="Decrivez une action recente"
                />
              </div>
            </>
          ) : null}

          {isEntrepreneur ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="business-stage">
                  Stade business
                </label>
                <Select id="business-stage" name="business_stage" defaultValue="">
                  <option value="" disabled>
                    Selectionner
                  </option>
                  <option value="idee">Idee</option>
                  <option value="prototype">Prototype</option>
                  <option value="lancement">Lancement</option>
                  <option value="croissance">Croissance</option>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="business-sector">
                  Secteur business
                </label>
                <Input id="business-sector" name="business_sector" placeholder="Ex: Agro, Tech" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <p className="text-sm font-medium">Besoins business</p>
                <div className="grid gap-2 md:grid-cols-2">
                  {businessNeedsOptions.map((option) => (
                    <label key={option} className="inline-flex items-center gap-2 text-sm">
                      <input type="checkbox" name="business_needs" value={option} />
                      {option}
                    </label>
                  ))}
                </div>
              </div>
            </>
          ) : null}

          {isOrgLeader ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="org-role">
                  Role dans l&apos;organisation
                </label>
                <Input id="org-role" name="org_role" placeholder="Ex: President, Coordinatrice" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="org-name-declared">
                  Nom organisation declaree
                </label>
                <Input id="org-name-declared" name="org_name_declared" placeholder="Nom officiel" />
              </div>
            </>
          ) : null}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface p-4">
        <h3 className="text-base font-semibold">D. Competences, ODD et objectifs</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="skills-text">
              Competences (separees par virgules)
            </label>
            <Input
              id="skills-text"
              name="skills_text"
              placeholder="Leadership, Communication"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="interests-text">
              Centres d&apos;interet (virgules)
            </label>
            <Input
              id="interests-text"
              name="interests_text"
              placeholder="Entrepreneuriat, Climat"
              required
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <p className="text-sm font-medium">ODD prioritaires (max 3)</p>
            <div className="grid gap-2 md:grid-cols-3">
              {oddOptions.map((odd) => (
                <label key={odd} className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" name="odd_priorities" value={String(odd)} />
                  ODD {odd}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium" htmlFor="goal-short-term">
              Objectif 3-6 mois
            </label>
            <textarea
              id="goal-short-term"
              name="goal_3_6_months"
              className="min-h-24 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/20"
              placeholder="Quel est votre objectif principal sur 3 a 6 mois ?"
              required
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface p-4">
        <h3 className="text-base font-semibold">E. Besoins, partenariat et consentements</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <p className="text-sm font-medium">Types de support attendus</p>
            <div className="grid gap-2 md:grid-cols-3">
              {supportTypeOptions.map((option) => (
                <label key={option} className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" name="support_types" value={option} />
                  {option}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="availability">
              Disponibilite (optionnel)
            </label>
            <Input id="availability" name="availability" placeholder="Ex: Soirs et weekends" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="contact-preference">
              Preference de contact
            </label>
            <Select id="contact-preference" name="contact_preference" defaultValue="" required>
              <option value="" disabled>
                Selectionner
              </option>
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
              <option value="call">Appel</option>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2 rounded-md border border-border p-3">
            <label className="inline-flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                name="partner_request"
                checked={partnerRequest}
                onChange={(event) => setPartnerRequest(event.target.checked)}
              />
              Je souhaite une demande partenaire organisation
            </label>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="org-type">
                  Type organisation
                </label>
                <Select id="org-type" name="org_type" defaultValue="" disabled={!partnerRequest}>
                  <option value="">Selectionner</option>
                  <option value="association">Association</option>
                  <option value="enterprise">Entreprise</option>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-2 md:col-span-2 rounded-md border border-border p-3">
            <label className="inline-flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" name="consent_terms" required />
              J&apos;accepte les conditions d&apos;utilisation (obligatoire)
            </label>
            <label className="mt-2 inline-flex items-center gap-2 text-sm">
              <input type="checkbox" name="consent_analytics" />
              J&apos;accepte l&apos;usage analytique interne (optionnel)
            </label>
            <label className="mt-2 inline-flex items-center gap-2 text-sm">
              <input type="checkbox" name="consent_ai_training_agg" />
              J&apos;accepte l&apos;usage IA agrege/anonyme (optionnel)
            </label>
          </div>
        </div>
      </section>

      {loadingLocations ? (
        <p className="text-sm text-muted-foreground">Chargement des donnees...</p>
      ) : null}
      {effectiveDisabledReason ? (
        <p className="text-sm text-amber-700">{effectiveDisabledReason}</p>
      ) : null}
      {alreadyOnboarded ? (
        <p className="text-sm text-primary">
          <Link className="font-semibold underline" href="/app/dashboard">
            Aller au dashboard
          </Link>
        </p>
      ) : null}
      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

      <div>
        <Button size="lg" type="submit" disabled={formDisabled}>
          {isPending ? "Creation en cours..." : "Terminer l'onboarding"}
        </Button>
      </div>
    </form>
  );
}
