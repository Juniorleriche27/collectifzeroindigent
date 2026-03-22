import {
  computeAgeRangeFromBirthDate,
  computeIndigenceAssessment,
  debtLevelOptions,
  dependentsCountOptions,
  employmentDurationOptions,
  foodSecurityOptions,
  formatBooleanChoice,
  healthAccessOptions,
  housingStatusOptions,
  incomeRangeOptions,
  incomeStabilityOptions,
  interestsTagOptions,
  labelForChoiceValue,
  labelForIndigenceLevel,
  normalizeBooleanChoice,
  normalizeChoiceValue,
  normalizeChoiceValues,
  recentShockOptions,
  savingsLevelOptions,
  skillsTagOptions,
  urgentNeedsOptions,
} from "@/lib/onboarding/socioeconomic";
import { joinMultiValue, splitMultiValue, type CsvRow } from "@/lib/import-export/csv";

type MemberSkill = {
  level?: string;
  name?: string;
};

export type SheetLocationLabels = {
  communeById: Map<string, string>;
  prefectureById: Map<string, string>;
  regionById: Map<string, string>;
};

export type SheetLocationLookups = {
  communeByName: Map<string, string>;
  prefectureByName: Map<string, string>;
  regionByName: Map<string, string>;
};

export type SheetMemberRow = {
  age_range?: string | null;
  availability?: string | null;
  birth_date?: string | null;
  business_needs?: string[] | null;
  business_sector?: string | null;
  business_stage?: string | null;
  cellule_primary?: string | null;
  cellule_secondary?: string | null;
  commune_id?: string | null;
  consent_ai_training_agg?: boolean | null;
  consent_analytics?: boolean | null;
  consent_terms?: boolean | null;
  contact_preference?: string | null;
  created_at?: string | null;
  debt_level?: string | null;
  dependents_count?: string | null;
  disability_or_limitation?: boolean | null;
  education_level?: string | null;
  email?: string | null;
  employment_duration_if_searching?: string | null;
  engagement_domains?: string[] | null;
  engagement_frequency?: string | null;
  engagement_recent_action?: string | null;
  first_name?: string | null;
  food_security?: string | null;
  gender?: string | null;
  goal_3_6_months?: string | null;
  health_access?: string | null;
  housing_status?: string | null;
  id: string;
  income_range?: string | null;
  income_stability?: string | null;
  indigence_factors?: string[] | null;
  indigence_level?: string | null;
  indigence_score?: number | null;
  interests?: string[] | null;
  interests_tags?: string[] | null;
  join_mode?: string | null;
  last_name?: string | null;
  locality?: string | null;
  mobility?: boolean | null;
  mobility_zones?: string | null;
  odd_priorities?: number[] | null;
  organisation_id?: string | null;
  org_name?: string | null;
  org_name_declared?: string | null;
  org_role?: string | null;
  org_type?: string | null;
  occupation_status?: string | null;
  partner_request?: boolean | null;
  phone?: string | null;
  prefecture_id?: string | null;
  profession_title?: string | null;
  recent_shock?: string | null;
  region_id?: string | null;
  savings_level?: string | null;
  skills?: MemberSkill[] | null;
  skills_tags?: string[] | null;
  status?: string | null;
  support_types?: string[] | null;
  updated_at?: string | null;
  urgent_needs?: string[] | null;
};

export const ONBOARDING_SHEET_HEADERS = [
  "id",
  "first_name",
  "last_name",
  "phone",
  "email",
  "gender",
  "birth_date",
  "age_range",
  "education_level",
  "occupation_status",
  "profession_title",
  "region_id",
  "region_name",
  "prefecture_id",
  "prefecture_name",
  "commune_id",
  "commune_name",
  "locality",
  "mobility",
  "mobility_zones",
  "join_mode",
  "organisation_id",
  "org_name",
  "cellule_primary",
  "cellule_secondary",
  "engagement_domains",
  "engagement_frequency",
  "engagement_recent_action",
  "business_stage",
  "business_sector",
  "business_needs",
  "org_role",
  "org_name_declared",
  "skills_text",
  "skills_tags",
  "interests_text",
  "interests_tags",
  "odd_priorities",
  "goal_3_6_months",
  "support_types",
  "availability",
  "contact_preference",
  "partner_request",
  "org_type",
  "consent_terms",
  "consent_analytics",
  "consent_ai_training_agg",
  "income_range",
  "income_stability",
  "dependents_count",
  "housing_status",
  "food_security",
  "health_access",
  "savings_level",
  "debt_level",
  "employment_duration_if_searching",
  "urgent_needs",
  "recent_shock",
  "disability_or_limitation",
  "indigence_score",
  "indigence_level",
  "indigence_factors",
  "status",
  "created_at",
  "updated_at",
] as const;

function normalizeKey(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .replaceAll(/[–—]/g, "-")
    .trim()
    .toLowerCase();
}

function parseBooleanField(value: string | null | undefined): boolean | null {
  return normalizeBooleanChoice(value);
}

function parseStringList(raw: string | null | undefined): string[] | null {
  const values = splitMultiValue(raw).map((value) => value.trim()).filter(Boolean);
  return values.length > 0 ? values : null;
}

function parseTextList(raw: string | null | undefined): string[] | null {
  const values = String(raw ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return values.length > 0 ? Array.from(new Set(values)) : null;
}

function parseOddPriorities(raw: string | null | undefined): number[] | null {
  const values = splitMultiValue(raw)
    .map((value) => value.replace(/^ODD\s+/i, "").trim())
    .map((value) => Number.parseInt(value, 10))
    .filter((value) => Number.isInteger(value));

  return values.length > 0 ? Array.from(new Set(values)) : null;
}

function parseSkills(raw: string | null | undefined): MemberSkill[] | null {
  const names = parseTextList(raw);
  if (!names) {
    return null;
  }
  return names.map((name) => ({ level: "intermediate", name }));
}

function skillsToText(skills: unknown): string {
  if (!Array.isArray(skills)) {
    return "";
  }

  const names = skills
    .map((item) => (item && typeof item === "object" ? (item as MemberSkill).name ?? null : null))
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim());

  return Array.from(new Set(names)).join(", ");
}

function resolveLocationId(
  idValue: string | null | undefined,
  nameValue: string | null | undefined,
  lookup: Map<string, string>,
): string | null {
  const normalizedId = idValue?.trim();
  if (normalizedId) {
    return normalizedId;
  }

  const key = normalizeKey(nameValue);
  return key ? lookup.get(key) ?? null : null;
}

export function createLocationLookups(args: {
  communes: Array<{ id: string; name: string }>;
  prefectures: Array<{ id: string; name: string }>;
  regions: Array<{ id: string; name: string }>;
}): SheetLocationLookups {
  return {
    communeByName: new Map(args.communes.map((item) => [normalizeKey(item.name), item.id])),
    prefectureByName: new Map(args.prefectures.map((item) => [normalizeKey(item.name), item.id])),
    regionByName: new Map(args.regions.map((item) => [normalizeKey(item.name), item.id])),
  };
}

export function createLocationLabels(args: {
  communes: Array<{ id: string; name: string }>;
  prefectures: Array<{ id: string; name: string }>;
  regions: Array<{ id: string; name: string }>;
}): SheetLocationLabels {
  return {
    communeById: new Map(args.communes.map((item) => [String(item.id), item.name])),
    prefectureById: new Map(args.prefectures.map((item) => [String(item.id), item.name])),
    regionById: new Map(args.regions.map((item) => [String(item.id), item.name])),
  };
}

export function buildOnboardingSheetRow(
  member: SheetMemberRow,
  locationLabels: SheetLocationLabels,
): CsvRow {
  const indigenceLevel =
    member.indigence_level === "faible" ||
    member.indigence_level === "moderee" ||
    member.indigence_level === "forte" ||
    member.indigence_level === "critique"
      ? labelForIndigenceLevel(member.indigence_level)
      : member.indigence_level ?? "";

  return {
    age_range: member.age_range ?? "",
    availability: member.availability ?? "",
    birth_date: member.birth_date ?? "",
    business_needs: joinMultiValue(member.business_needs ?? []),
    business_sector: member.business_sector ?? "",
    business_stage: member.business_stage ?? "",
    cellule_primary: member.cellule_primary ?? "",
    cellule_secondary: member.cellule_secondary ?? "",
    commune_id: member.commune_id ?? "",
    commune_name: locationLabels.communeById.get(String(member.commune_id ?? "")) ?? "",
    consent_ai_training_agg: formatBooleanChoice(member.consent_ai_training_agg),
    consent_analytics: formatBooleanChoice(member.consent_analytics),
    consent_terms: formatBooleanChoice(member.consent_terms),
    contact_preference: member.contact_preference ?? "",
    created_at: member.created_at ?? "",
    debt_level: labelForChoiceValue(member.debt_level, debtLevelOptions),
    dependents_count: labelForChoiceValue(member.dependents_count, dependentsCountOptions),
    disability_or_limitation: formatBooleanChoice(member.disability_or_limitation),
    education_level: member.education_level ?? "",
    email: member.email ?? "",
    employment_duration_if_searching: labelForChoiceValue(
      member.employment_duration_if_searching,
      employmentDurationOptions,
    ),
    engagement_domains: joinMultiValue(member.engagement_domains ?? []),
    engagement_frequency: member.engagement_frequency ?? "",
    engagement_recent_action: member.engagement_recent_action ?? "",
    first_name: member.first_name ?? "",
    food_security: labelForChoiceValue(member.food_security, foodSecurityOptions),
    gender: member.gender ?? "",
    goal_3_6_months: member.goal_3_6_months ?? "",
    health_access: labelForChoiceValue(member.health_access, healthAccessOptions),
    housing_status: labelForChoiceValue(member.housing_status, housingStatusOptions),
    id: member.id,
    income_range: labelForChoiceValue(member.income_range, incomeRangeOptions),
    income_stability: labelForChoiceValue(member.income_stability, incomeStabilityOptions),
    indigence_factors: joinMultiValue(member.indigence_factors ?? []),
    indigence_level: indigenceLevel,
    indigence_score:
      typeof member.indigence_score === "number" ? String(member.indigence_score) : "",
    interests_tags: joinMultiValue(
      (member.interests_tags ?? []).map((value) => labelForChoiceValue(value, interestsTagOptions)),
    ),
    interests_text: (member.interests ?? []).join(", "),
    join_mode: member.join_mode ?? "",
    last_name: member.last_name ?? "",
    locality: member.locality ?? "",
    mobility: formatBooleanChoice(member.mobility),
    mobility_zones: member.mobility_zones ?? "",
    odd_priorities: joinMultiValue((member.odd_priorities ?? []).map((value) => String(value))),
    organisation_id: member.organisation_id ?? "",
    org_name: member.org_name ?? "",
    org_name_declared: member.org_name_declared ?? "",
    org_role: member.org_role ?? "",
    org_type: member.org_type ?? "",
    occupation_status: member.occupation_status ?? "",
    partner_request: formatBooleanChoice(member.partner_request),
    phone: member.phone ?? "",
    prefecture_id: member.prefecture_id ?? "",
    prefecture_name: locationLabels.prefectureById.get(String(member.prefecture_id ?? "")) ?? "",
    profession_title: member.profession_title ?? "",
    recent_shock: labelForChoiceValue(member.recent_shock, recentShockOptions),
    region_id: member.region_id ?? "",
    region_name: locationLabels.regionById.get(String(member.region_id ?? "")) ?? "",
    savings_level: labelForChoiceValue(member.savings_level, savingsLevelOptions),
    skills_tags: joinMultiValue(
      (member.skills_tags ?? []).map((value) => labelForChoiceValue(value, skillsTagOptions)),
    ),
    skills_text: skillsToText(member.skills),
    status: member.status ?? "",
    support_types: joinMultiValue(member.support_types ?? []),
    updated_at: member.updated_at ?? "",
    urgent_needs: joinMultiValue(
      (member.urgent_needs ?? []).map((value) => labelForChoiceValue(value, urgentNeedsOptions)),
    ),
  };
}

export function buildOnboardingImportPayload(
  row: CsvRow,
  locationLookups: SheetLocationLookups,
): {
  error?: string;
  memberLookup: { email: string | null; id: string | null; phone: string | null };
  payload?: Record<string, unknown>;
} {
  const id = row.id?.trim() || null;
  const email = row.email?.trim() || null;
  const phone = row.phone?.trim() || null;
  const birthDate = row.birth_date?.trim() || null;
  const ageRange =
    computeAgeRangeFromBirthDate(birthDate) ?? row.age_range?.trim() ?? null;
  const regionId = resolveLocationId(row.region_id, row.region_name, locationLookups.regionByName);
  const prefectureId = resolveLocationId(
    row.prefecture_id,
    row.prefecture_name,
    locationLookups.prefectureByName,
  );
  const communeId = resolveLocationId(
    row.commune_id,
    row.commune_name,
    locationLookups.communeByName,
  );

  if (!id && !email && !phone) {
    return {
      error: "Aucun identifiant de correspondance fourni (id, email ou téléphone).",
      memberLookup: { email, id, phone },
    };
  }

  if (!row.first_name?.trim() || !row.last_name?.trim() || !phone) {
    return {
      error: "Les champs first_name, last_name et phone sont obligatoires pour l'import.",
      memberLookup: { email, id, phone },
    };
  }

  if (!birthDate) {
    return {
      error: "Le champ birth_date est obligatoire pour l'import onboarding.",
      memberLookup: { email, id, phone },
    };
  }

  if (!regionId || !prefectureId || !communeId) {
    return {
      error: "Les localisations region/prefecture/commune sont incomplètes ou introuvables.",
      memberLookup: { email, id, phone },
    };
  }

  const joinMode = row.join_mode?.trim() || "personal";
  const cellulePrimary =
    row.cellule_primary?.trim() ||
    (joinMode === "enterprise"
      ? "entrepreneur"
      : joinMode === "association"
        ? "org_leader"
        : "engaged");

  const occupationStatus = row.occupation_status?.trim() || "";
  const incomeRange = normalizeChoiceValue(row.income_range, incomeRangeOptions);
  const incomeStability = normalizeChoiceValue(row.income_stability, incomeStabilityOptions);
  const dependentsCount = normalizeChoiceValue(row.dependents_count, dependentsCountOptions);
  const housingStatus = normalizeChoiceValue(row.housing_status, housingStatusOptions);
  const foodSecurity = normalizeChoiceValue(row.food_security, foodSecurityOptions);
  const healthAccess = normalizeChoiceValue(row.health_access, healthAccessOptions);
  const savingsLevel = normalizeChoiceValue(row.savings_level, savingsLevelOptions);
  const debtLevel = normalizeChoiceValue(row.debt_level, debtLevelOptions);
  const employmentDurationIfSearching = normalizeChoiceValue(
    row.employment_duration_if_searching,
    employmentDurationOptions,
  );
  const urgentNeeds = normalizeChoiceValues(splitMultiValue(row.urgent_needs), urgentNeedsOptions);
  const recentShock = normalizeChoiceValue(row.recent_shock, recentShockOptions);
  const disabilityOrLimitation = parseBooleanField(row.disability_or_limitation);
  const partnerRequest = parseBooleanField(row.partner_request) ?? false;
  const mobility = parseBooleanField(row.mobility);
  const consentTerms = parseBooleanField(row.consent_terms) ?? false;
  const consentAnalytics = parseBooleanField(row.consent_analytics) ?? false;
  const consentAiTrainingAgg = parseBooleanField(row.consent_ai_training_agg) ?? false;
  const skillsTags = normalizeChoiceValues(splitMultiValue(row.skills_tags), skillsTagOptions);
  const interestsTags = normalizeChoiceValues(splitMultiValue(row.interests_tags), interestsTagOptions);
  const skills = parseSkills(row.skills_text);
  const interests = parseTextList(row.interests_text);
  const oddPriorities = parseOddPriorities(row.odd_priorities);
  const engagementDomains = parseStringList(row.engagement_domains);
  const businessNeeds = parseStringList(row.business_needs);
  const supportTypes = parseStringList(row.support_types);

  if (
    !row.education_level?.trim() ||
    !occupationStatus ||
    !row.goal_3_6_months?.trim() ||
    !row.contact_preference?.trim() ||
    !skills?.length ||
    !interests?.length ||
    !oddPriorities?.length ||
    !supportTypes?.length ||
    !incomeRange ||
    !incomeStability ||
    !dependentsCount ||
    !housingStatus ||
    !foodSecurity ||
    !healthAccess ||
    !debtLevel ||
    urgentNeeds.length === 0
  ) {
    return {
      error: "La ligne ne contient pas tous les champs obligatoires de la fiche onboarding.",
      memberLookup: { email, id, phone },
    };
  }

  if (occupationStatus === "recherche" && !employmentDurationIfSearching) {
    return {
      error: "employment_duration_if_searching est obligatoire si occupation_status = recherche.",
      memberLookup: { email, id, phone },
    };
  }

  const indigenceAssessment = computeIndigenceAssessment({
    debtLevel,
    dependentsCount,
    disabilityOrLimitation,
    employmentDurationIfSearching,
    foodSecurity,
    healthAccess,
    housingStatus,
    incomeRange,
    incomeStability,
    occupationStatus,
    recentShock,
    savingsLevel,
    urgentNeeds,
  });

  const payload: Record<string, unknown> = {
    age_range: ageRange,
    availability: row.availability?.trim() || null,
    birth_date: birthDate,
    business_needs: businessNeeds,
    business_sector: row.business_sector?.trim() || null,
    business_stage: row.business_stage?.trim() || null,
    cellule_primary: cellulePrimary,
    cellule_secondary: row.cellule_secondary?.trim() || null,
    commune_id: communeId,
    consent_ai_training_agg: consentAiTrainingAgg,
    consent_analytics: consentAnalytics,
    consent_terms: consentTerms,
    contact_preference: row.contact_preference?.trim() || null,
    debt_level: debtLevel,
    dependents_count: dependentsCount,
    disability_or_limitation: disabilityOrLimitation,
    education_level: row.education_level?.trim() || null,
    email,
    employment_duration_if_searching: employmentDurationIfSearching,
    engagement_domains: engagementDomains,
    engagement_frequency: row.engagement_frequency?.trim() || null,
    engagement_recent_action: row.engagement_recent_action?.trim() || null,
    first_name: row.first_name?.trim() || null,
    food_security: foodSecurity,
    gender: row.gender?.trim() || null,
    goal_3_6_months: row.goal_3_6_months?.trim() || null,
    health_access: healthAccess,
    housing_status: housingStatus,
    income_range: incomeRange,
    income_stability: incomeStability,
    indigence_factors: indigenceAssessment.indigenceFactors,
    indigence_level: indigenceAssessment.indigenceLevel,
    indigence_score: indigenceAssessment.indigenceScore,
    interests,
    interests_tags: interestsTags.length > 0 ? interestsTags : null,
    join_mode: joinMode,
    last_name: row.last_name?.trim() || null,
    locality: row.locality?.trim() || null,
    mobility,
    mobility_zones: row.mobility_zones?.trim() || null,
    odd_priorities: oddPriorities,
    organisation_id: row.organisation_id?.trim() || null,
    org_name: row.org_name?.trim() || null,
    org_name_declared: row.org_name_declared?.trim() || null,
    org_role: row.org_role?.trim() || null,
    org_type: row.org_type?.trim() || null,
    occupation_status: occupationStatus,
    partner_request: partnerRequest,
    phone,
    prefecture_id: prefectureId,
    profession_title: row.profession_title?.trim() || null,
    recent_shock: recentShock,
    region_id: regionId,
    savings_level: savingsLevel,
    skills,
    skills_tags: skillsTags.length > 0 ? skillsTags : null,
    support_types: supportTypes,
    urgent_needs: urgentNeeds,
  };

  return {
    memberLookup: { email, id, phone },
    payload,
  };
}
