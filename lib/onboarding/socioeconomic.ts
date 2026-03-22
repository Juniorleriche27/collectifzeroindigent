export type ChoiceOption = {
  label: string;
  value: string;
};

export type IndigenceInput = {
  debtLevel: string | null;
  dependentsCount: string | null;
  disabilityOrLimitation: boolean | null;
  employmentDurationIfSearching: string | null;
  foodSecurity: string | null;
  healthAccess: string | null;
  housingStatus: string | null;
  incomeRange: string | null;
  incomeStability: string | null;
  occupationStatus: string | null;
  recentShock: string | null;
  savingsLevel: string | null;
  urgentNeeds: string[] | null;
};

export type IndigenceAssessment = {
  indigenceFactors: string[];
  indigenceLevel: "faible" | "moderee" | "forte" | "critique";
  indigenceScore: number;
};

export type IndigenceBreakdownItem = {
  code:
    | "income_range"
    | "income_stability"
    | "dependents_count"
    | "housing_status"
    | "food_security"
    | "health_access"
    | "savings_level"
    | "debt_level"
    | "shock_vulnerability";
  label: string;
  maxPoints: number;
  points: number;
  valueLabel: string;
};

export const incomeRangeOptions: ChoiceOption[] = [
  { value: "0-10000", label: "0-10 000" },
  { value: "10001-25000", label: "10 001-25 000" },
  { value: "25001-50000", label: "25 001-50 000" },
  { value: "50001-100000", label: "50 001-100 000" },
  { value: "100001-200000", label: "100 001-200 000" },
  { value: "200000+", label: "200 000+" },
];

export const incomeStabilityOptions: ChoiceOption[] = [
  { value: "no_income", label: "aucun revenu" },
  { value: "very_irregular", label: "très irrégulier" },
  { value: "irregular", label: "irrégulier" },
  { value: "somewhat_stable", label: "plutôt stable" },
  { value: "stable", label: "stable" },
];

export const dependentsCountOptions: ChoiceOption[] = [
  { value: "0", label: "0" },
  { value: "1-2", label: "1-2" },
  { value: "3-5", label: "3-5" },
  { value: "6+", label: "6+" },
];

export const housingStatusOptions: ChoiceOption[] = [
  { value: "no_stable_housing", label: "sans logement stable" },
  { value: "hosted", label: "hébergé" },
  { value: "tenant", label: "locataire" },
  { value: "owner", label: "propriétaire" },
];

export const foodSecurityOptions: ChoiceOption[] = [
  { value: "regular", label: "oui" },
  { value: "sometimes_difficult", label: "parfois difficile" },
  { value: "often_difficult", label: "souvent difficile" },
];

export const healthAccessOptions: ChoiceOption[] = [
  { value: "easy", label: "facile" },
  { value: "difficult", label: "difficile" },
  { value: "very_difficult", label: "très difficile" },
];

export const savingsLevelOptions: ChoiceOption[] = [
  { value: "none", label: "aucune" },
  { value: "under_25000", label: "moins de 25 000" },
  { value: "25000-100000", label: "25 000-100 000" },
  { value: "over_100000", label: "plus de 100 000" },
];

export const debtLevelOptions: ChoiceOption[] = [
  { value: "none", label: "aucune" },
  { value: "low", label: "faible" },
  { value: "medium", label: "moyen" },
  { value: "high", label: "élevé" },
];

export const employmentDurationOptions: ChoiceOption[] = [
  { value: "under_3_months", label: "moins de 3 mois" },
  { value: "3_6_months", label: "3-6 mois" },
  { value: "6_12_months", label: "6-12 mois" },
  { value: "over_12_months", label: "plus de 12 mois" },
];

export const urgentNeedsOptions: ChoiceOption[] = [
  { value: "food", label: "alimentation" },
  { value: "health", label: "santé" },
  { value: "housing", label: "logement" },
  { value: "employment", label: "emploi" },
  { value: "financing", label: "financement" },
  { value: "training", label: "formation" },
  { value: "schooling", label: "scolarité" },
  { value: "social_support", label: "accompagnement social" },
];

export const recentShockOptions: ChoiceOption[] = [
  { value: "none", label: "aucun" },
  { value: "income_loss", label: "perte emploi/revenus" },
  { value: "illness", label: "maladie" },
  { value: "bereavement", label: "décès proche" },
  { value: "disaster", label: "catastrophe/sinistre" },
  { value: "other", label: "autre" },
];

export const yesNoOptions: ChoiceOption[] = [
  { value: "non", label: "non" },
  { value: "oui", label: "oui" },
];

export const skillsTagOptions: ChoiceOption[] = [
  { value: "leadership", label: "Leadership" },
  { value: "communication", label: "Communication" },
  { value: "gestion_projet", label: "Gestion de projet" },
  { value: "entrepreneuriat", label: "Entrepreneuriat" },
  { value: "gestion_financiere", label: "Gestion financière" },
  { value: "marketing", label: "Marketing" },
  { value: "vente", label: "Vente" },
  { value: "numerique", label: "Numérique" },
  { value: "developpement_web", label: "Développement web" },
  { value: "design_graphique", label: "Design graphique" },
  { value: "agriculture", label: "Agriculture" },
  { value: "artisanat", label: "Artisanat" },
  { value: "plaidoyer", label: "Plaidoyer" },
  { value: "animation_communautaire", label: "Animation communautaire" },
  { value: "gestion_associative", label: "Gestion associative" },
  { value: "formation", label: "Formation" },
];

export const interestsTagOptions: ChoiceOption[] = [
  { value: "emploi", label: "Emploi" },
  { value: "entrepreneuriat", label: "Entrepreneuriat" },
  { value: "innovation", label: "Innovation" },
  { value: "agriculture", label: "Agriculture" },
  { value: "climat", label: "Climat" },
  { value: "sante", label: "Santé" },
  { value: "education", label: "Éducation" },
  { value: "inclusion", label: "Inclusion" },
  { value: "citoyennete", label: "Citoyenneté" },
  { value: "droits_humains", label: "Droits humains" },
  { value: "leadership", label: "Leadership" },
  { value: "numerique", label: "Numérique" },
  { value: "finance", label: "Finance" },
  { value: "culture", label: "Culture" },
  { value: "sport", label: "Sport" },
  { value: "reseautage", label: "Réseautage" },
];

const optionLabelByValue = new Map<string, string>(
  [
    ...incomeRangeOptions,
    ...incomeStabilityOptions,
    ...dependentsCountOptions,
    ...housingStatusOptions,
    ...foodSecurityOptions,
    ...healthAccessOptions,
    ...savingsLevelOptions,
    ...debtLevelOptions,
    ...employmentDurationOptions,
    ...urgentNeedsOptions,
    ...recentShockOptions,
    ...yesNoOptions,
    ...skillsTagOptions,
    ...interestsTagOptions,
  ].map((option) => [option.value, option.label]),
);

function buildLooseLookup(options: ChoiceOption[]): Map<string, string> {
  return new Map(
    options.flatMap((option) => [
      [normalizeLooseValue(option.value), option.value],
      [normalizeLooseValue(option.label), option.value],
    ]),
  );
}

function normalizeLooseValue(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .replaceAll(/[–—]/g, "-")
    .replaceAll(/[’']/g, "'")
    .replaceAll(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function calculateAge(birthDate: string): number | null {
  const parsedDate = new Date(birthDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  const now = new Date();
  let age = now.getUTCFullYear() - parsedDate.getUTCFullYear();
  const monthDelta = now.getUTCMonth() - parsedDate.getUTCMonth();
  const dayDelta = now.getUTCDate() - parsedDate.getUTCDate();

  if (monthDelta < 0 || (monthDelta === 0 && dayDelta < 0)) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

export function computeAgeRangeFromBirthDate(birthDate: string | null | undefined): string | null {
  const normalizedBirthDate = birthDate?.trim();
  if (!normalizedBirthDate) {
    return null;
  }

  const age = calculateAge(normalizedBirthDate);
  if (age === null) {
    return null;
  }
  if (age < 20) {
    return "15-19";
  }
  if (age < 25) {
    return "20-24";
  }
  if (age < 30) {
    return "25-29";
  }
  if (age < 36) {
    return "30-35";
  }
  return "36+";
}

export function normalizeBooleanChoice(value: string | null | undefined): boolean | null {
  const normalized = normalizeLooseValue(value);
  if (!normalized) {
    return null;
  }
  if (["oui", "yes", "true", "1"].includes(normalized)) {
    return true;
  }
  if (["non", "no", "false", "0"].includes(normalized)) {
    return false;
  }
  return null;
}

export function formatBooleanChoice(value: boolean | null | undefined): string {
  if (value === true) {
    return "oui";
  }
  if (value === false) {
    return "non";
  }
  return "";
}

export function normalizeChoiceValue(
  value: string | null | undefined,
  options: ChoiceOption[],
): string | null {
  const normalized = normalizeLooseValue(value);
  if (!normalized) {
    return null;
  }

  return buildLooseLookup(options).get(normalized) ?? null;
}

export function normalizeChoiceValues(
  values: Array<string | null | undefined>,
  options: ChoiceOption[],
): string[] {
  const lookup = buildLooseLookup(options);
  const normalizedValues = values
    .map((value) => lookup.get(normalizeLooseValue(value)) ?? null)
    .filter((value): value is string => Boolean(value));

  return Array.from(new Set(normalizedValues));
}

export function labelForChoiceValue(
  value: string | null | undefined,
  options: ChoiceOption[],
): string {
  if (!value) {
    return "";
  }

  return options.find((option) => option.value === value)?.label ?? value;
}

export function labelForStoredChoice(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  return optionLabelByValue.get(value) ?? value;
}

export function labelForIndigenceLevel(level: IndigenceAssessment["indigenceLevel"]): string {
  if (level === "critique") {
    return "vulnérabilité critique";
  }
  if (level === "forte") {
    return "forte vulnérabilité";
  }
  if (level === "moderee") {
    return "vulnérabilité modérée";
  }
  return "faible vulnérabilité";
}

export function buildIndigenceBreakdown(input: IndigenceInput): IndigenceBreakdownItem[] {
  const incomePoints =
    {
      "0-10000": 20,
      "10001-25000": 15,
      "25001-50000": 10,
      "50001-100000": 5,
      "100001-200000": 0,
      "200000+": 0,
    }[input.incomeRange ?? ""] ?? 0;

  const stabilityPoints =
    {
      no_income: 10,
      very_irregular: 8,
      irregular: 5,
      somewhat_stable: 2,
      stable: 0,
    }[input.incomeStability ?? ""] ?? 0;

  const dependentsPoints =
    {
      "0": 0,
      "1-2": 3,
      "3-5": 7,
      "6+": 10,
    }[input.dependentsCount ?? ""] ?? 0;

  const housingPoints =
    {
      no_stable_housing: 10,
      hosted: 6,
      tenant: 3,
      owner: 0,
    }[input.housingStatus ?? ""] ?? 0;

  const foodPoints =
    {
      regular: 0,
      sometimes_difficult: 8,
      often_difficult: 15,
    }[input.foodSecurity ?? ""] ?? 0;

  const healthPoints =
    {
      easy: 0,
      difficult: 5,
      very_difficult: 10,
    }[input.healthAccess ?? ""] ?? 0;

  const savingsPoints =
    {
      none: 8,
      under_25000: 5,
      "25000-100000": 2,
      over_100000: 0,
    }[input.savingsLevel ?? ""] ?? 0;

  const debtPoints =
    {
      none: 0,
      low: 2,
      medium: 4,
      high: 7,
    }[input.debtLevel ?? ""] ?? 0;

  const recentShockPoints =
    {
      none: 0,
      income_loss: 6,
      illness: 5,
      bereavement: 6,
      disaster: 8,
      other: 4,
    }[input.recentShock ?? ""] ?? 0;

  const disabilityPoints = input.disabilityOrLimitation ? 4 : 0;
  const employmentSearchPoints =
    input.occupationStatus === "recherche"
      ? {
          under_3_months: 2,
          "3_6_months": 4,
          "6_12_months": 6,
          over_12_months: 8,
        }[input.employmentDurationIfSearching ?? ""] ?? 0
      : 0;

  const shockValueParts = [
    labelForChoiceValue(input.recentShock, recentShockOptions) || "aucun choc",
    `limitation: ${formatBooleanChoice(input.disabilityOrLimitation) || "non renseigne"}`,
    input.occupationStatus === "recherche"
      ? `recherche: ${labelForChoiceValue(
          input.employmentDurationIfSearching,
          employmentDurationOptions,
        ) || "non renseigne"}`
      : null,
  ].filter((value): value is string => Boolean(value));

  return [
    {
      code: "income_range",
      label: "Revenu mensuel",
      maxPoints: 20,
      points: incomePoints,
      valueLabel: labelForChoiceValue(input.incomeRange, incomeRangeOptions) || "-",
    },
    {
      code: "income_stability",
      label: "Stabilite du revenu",
      maxPoints: 10,
      points: stabilityPoints,
      valueLabel: labelForChoiceValue(input.incomeStability, incomeStabilityOptions) || "-",
    },
    {
      code: "dependents_count",
      label: "Personnes a charge",
      maxPoints: 10,
      points: dependentsPoints,
      valueLabel: labelForChoiceValue(input.dependentsCount, dependentsCountOptions) || "-",
    },
    {
      code: "housing_status",
      label: "Situation de logement",
      maxPoints: 10,
      points: housingPoints,
      valueLabel: labelForChoiceValue(input.housingStatus, housingStatusOptions) || "-",
    },
    {
      code: "food_security",
      label: "Acces a la nourriture",
      maxPoints: 15,
      points: foodPoints,
      valueLabel: labelForChoiceValue(input.foodSecurity, foodSecurityOptions) || "-",
    },
    {
      code: "health_access",
      label: "Acces aux soins",
      maxPoints: 10,
      points: healthPoints,
      valueLabel: labelForChoiceValue(input.healthAccess, healthAccessOptions) || "-",
    },
    {
      code: "savings_level",
      label: "Niveau d'epargne",
      maxPoints: 8,
      points: savingsPoints,
      valueLabel: labelForChoiceValue(input.savingsLevel, savingsLevelOptions) || "-",
    },
    {
      code: "debt_level",
      label: "Niveau d'endettement",
      maxPoints: 7,
      points: debtPoints,
      valueLabel: labelForChoiceValue(input.debtLevel, debtLevelOptions) || "-",
    },
    {
      code: "shock_vulnerability",
      label: "Choc recent / vulnerabilite",
      maxPoints: 10,
      points: Math.min(10, recentShockPoints + disabilityPoints + employmentSearchPoints),
      valueLabel: shockValueParts.join(" | "),
    },
  ];
}

export function computeIndigenceAssessment(input: IndigenceInput): IndigenceAssessment {
  const incomePoints =
    {
      "0-10000": 20,
      "10001-25000": 15,
      "25001-50000": 10,
      "50001-100000": 5,
      "100001-200000": 0,
      "200000+": 0,
    }[input.incomeRange ?? ""] ?? 0;

  const stabilityPoints =
    {
      no_income: 10,
      very_irregular: 8,
      irregular: 5,
      somewhat_stable: 2,
      stable: 0,
    }[input.incomeStability ?? ""] ?? 0;

  const dependentsPoints =
    {
      "0": 0,
      "1-2": 3,
      "3-5": 7,
      "6+": 10,
    }[input.dependentsCount ?? ""] ?? 0;

  const housingPoints =
    {
      no_stable_housing: 10,
      hosted: 6,
      tenant: 3,
      owner: 0,
    }[input.housingStatus ?? ""] ?? 0;

  const foodPoints =
    {
      regular: 0,
      sometimes_difficult: 8,
      often_difficult: 15,
    }[input.foodSecurity ?? ""] ?? 0;

  const healthPoints =
    {
      easy: 0,
      difficult: 5,
      very_difficult: 10,
    }[input.healthAccess ?? ""] ?? 0;

  const savingsPoints =
    {
      none: 8,
      under_25000: 5,
      "25000-100000": 2,
      over_100000: 0,
    }[input.savingsLevel ?? ""] ?? 0;

  const debtPoints =
    {
      none: 0,
      low: 2,
      medium: 4,
      high: 7,
    }[input.debtLevel ?? ""] ?? 0;

  const recentShockPoints =
    {
      none: 0,
      income_loss: 6,
      illness: 5,
      bereavement: 6,
      disaster: 8,
      other: 4,
    }[input.recentShock ?? ""] ?? 0;

  const disabilityPoints = input.disabilityOrLimitation ? 4 : 0;
  const employmentSearchPoints =
    input.occupationStatus === "recherche"
      ? {
          under_3_months: 2,
          "3_6_months": 4,
          "6_12_months": 6,
          over_12_months: 8,
        }[input.employmentDurationIfSearching ?? ""] ?? 0
      : 0;

  const shockAndVulnerabilityPoints = Math.min(
    10,
    recentShockPoints + disabilityPoints + employmentSearchPoints,
  );

  const total =
    incomePoints +
    stabilityPoints +
    dependentsPoints +
    housingPoints +
    foodPoints +
    healthPoints +
    savingsPoints +
    debtPoints +
    shockAndVulnerabilityPoints;

  const factors = [
    incomePoints >= 15
      ? { label: "revenu très faible", points: incomePoints }
      : incomePoints >= 10
        ? { label: "revenu faible", points: incomePoints }
        : null,
    stabilityPoints >= 8
      ? { label: "absence de revenu stable", points: stabilityPoints }
      : stabilityPoints >= 5
        ? { label: "revenus irréguliers", points: stabilityPoints }
        : null,
    dependentsPoints === 10
      ? { label: "6+ personnes à charge", points: dependentsPoints }
      : dependentsPoints >= 7
        ? { label: "3 à 5 personnes à charge", points: dependentsPoints }
        : dependentsPoints >= 3
          ? { label: "1 à 2 personnes à charge", points: dependentsPoints }
          : null,
    housingPoints === 10
      ? { label: "sans logement stable", points: housingPoints }
      : housingPoints >= 6
        ? { label: "situation de logement précaire", points: housingPoints }
        : null,
    foodPoints === 15
      ? { label: "accès souvent difficile à la nourriture", points: foodPoints }
      : foodPoints >= 8
        ? { label: "accès parfois difficile à la nourriture", points: foodPoints }
        : null,
    healthPoints === 10
      ? { label: "accès très difficile aux soins", points: healthPoints }
      : healthPoints >= 5
        ? { label: "accès difficile aux soins", points: healthPoints }
        : null,
    savingsPoints >= 8
      ? { label: "aucune épargne disponible", points: savingsPoints }
      : savingsPoints >= 5
        ? { label: "épargne très limitée", points: savingsPoints }
        : null,
    debtPoints >= 7
      ? { label: "dette élevée", points: debtPoints }
      : debtPoints >= 4
        ? { label: "niveau d'endettement notable", points: debtPoints }
        : null,
    employmentSearchPoints >= 8
      ? { label: "sans emploi depuis plus de 12 mois", points: employmentSearchPoints }
      : employmentSearchPoints >= 6
        ? { label: "sans emploi depuis 6 à 12 mois", points: employmentSearchPoints }
        : employmentSearchPoints >= 4
          ? { label: "sans emploi depuis 3 à 6 mois", points: employmentSearchPoints }
          : null,
    recentShockPoints >= 8
      ? { label: "catastrophe ou sinistre récent", points: recentShockPoints }
      : recentShockPoints >= 6
        ? { label: "choc récent sur les revenus ou la famille", points: recentShockPoints }
        : recentShockPoints >= 4
          ? { label: "événement difficile récent", points: recentShockPoints }
          : null,
    disabilityPoints > 0
      ? { label: "limitation ou handicap impactant les activités", points: disabilityPoints }
      : null,
  ]
    .filter((item): item is { label: string; points: number } => Boolean(item))
    .sort((first, second) => second.points - first.points);

  const fallbackUrgentNeeds = (input.urgentNeeds ?? []).map((need) => {
    const label =
      {
        food: "besoin urgent en alimentation",
        health: "besoin urgent en santé",
        housing: "besoin urgent en logement",
        employment: "besoin urgent en emploi",
        financing: "besoin urgent en financement",
        training: "besoin urgent en formation",
        schooling: "besoin urgent en scolarité",
        social_support: "besoin urgent en accompagnement social",
      }[need] ?? null;

    return label ? { label, points: 1 } : null;
  });

  for (const urgentNeed of fallbackUrgentNeeds) {
    if (!urgentNeed) {
      continue;
    }
    if (factors.some((item) => item.label === urgentNeed.label)) {
      continue;
    }
    factors.push(urgentNeed);
  }

  const uniqueFactors = Array.from(new Set(factors.map((item) => item.label))).slice(0, 5);

  let indigenceLevel: IndigenceAssessment["indigenceLevel"] = "faible";
  if (total >= 75) {
    indigenceLevel = "critique";
  } else if (total >= 50) {
    indigenceLevel = "forte";
  } else if (total >= 25) {
    indigenceLevel = "moderee";
  }

  return {
    indigenceFactors: uniqueFactors,
    indigenceLevel,
    indigenceScore: total,
  };
}
