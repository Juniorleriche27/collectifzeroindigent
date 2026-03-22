type IndigenceInput = {
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
  indigenceLevel: 'faible' | 'moderee' | 'forte' | 'critique';
  indigenceScore: number;
};

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

export function computeAgeRangeFromBirthDate(
  birthDate: string | null | undefined,
): string | null {
  const normalizedBirthDate = birthDate?.trim();
  if (!normalizedBirthDate) {
    return null;
  }

  const age = calculateAge(normalizedBirthDate);
  if (age === null) {
    return null;
  }
  if (age < 20) {
    return '15-19';
  }
  if (age < 25) {
    return '20-24';
  }
  if (age < 30) {
    return '25-29';
  }
  if (age < 36) {
    return '30-35';
  }
  return '36+';
}

export function computeIndigenceAssessment(
  input: IndigenceInput,
): IndigenceAssessment {
  const incomePoints =
    {
      '0-10000': 20,
      '10001-25000': 15,
      '25001-50000': 10,
      '50001-100000': 5,
      '100001-200000': 0,
      '200000+': 0,
    }[input.incomeRange ?? ''] ?? 0;

  const stabilityPoints =
    {
      no_income: 10,
      very_irregular: 8,
      irregular: 5,
      somewhat_stable: 2,
      stable: 0,
    }[input.incomeStability ?? ''] ?? 0;

  const dependentsPoints =
    {
      '0': 0,
      '1-2': 3,
      '3-5': 7,
      '6+': 10,
    }[input.dependentsCount ?? ''] ?? 0;

  const housingPoints =
    {
      no_stable_housing: 10,
      hosted: 6,
      tenant: 3,
      owner: 0,
    }[input.housingStatus ?? ''] ?? 0;

  const foodPoints =
    {
      regular: 0,
      sometimes_difficult: 8,
      often_difficult: 15,
    }[input.foodSecurity ?? ''] ?? 0;

  const healthPoints =
    {
      easy: 0,
      difficult: 5,
      very_difficult: 10,
    }[input.healthAccess ?? ''] ?? 0;

  const savingsPoints =
    {
      none: 8,
      under_25000: 5,
      '25000-100000': 2,
      over_100000: 0,
    }[input.savingsLevel ?? ''] ?? 0;

  const debtPoints =
    {
      none: 0,
      low: 2,
      medium: 4,
      high: 7,
    }[input.debtLevel ?? ''] ?? 0;

  const recentShockPoints =
    {
      none: 0,
      income_loss: 6,
      illness: 5,
      bereavement: 6,
      disaster: 8,
      other: 4,
    }[input.recentShock ?? ''] ?? 0;

  const disabilityPoints = input.disabilityOrLimitation ? 4 : 0;
  const employmentSearchPoints =
    input.occupationStatus === 'recherche'
      ? ({
          under_3_months: 2,
          '3_6_months': 4,
          '6_12_months': 6,
          over_12_months: 8,
        }[input.employmentDurationIfSearching ?? ''] ?? 0)
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
      ? { label: 'revenu très faible', points: incomePoints }
      : incomePoints >= 10
        ? { label: 'revenu faible', points: incomePoints }
        : null,
    stabilityPoints >= 8
      ? { label: 'absence de revenu stable', points: stabilityPoints }
      : stabilityPoints >= 5
        ? { label: 'revenus irréguliers', points: stabilityPoints }
        : null,
    dependentsPoints === 10
      ? { label: '6+ personnes à charge', points: dependentsPoints }
      : dependentsPoints >= 7
        ? { label: '3 à 5 personnes à charge', points: dependentsPoints }
        : dependentsPoints >= 3
          ? { label: '1 à 2 personnes à charge', points: dependentsPoints }
          : null,
    housingPoints === 10
      ? { label: 'sans logement stable', points: housingPoints }
      : housingPoints >= 6
        ? { label: 'situation de logement précaire', points: housingPoints }
        : null,
    foodPoints === 15
      ? { label: 'accès souvent difficile à la nourriture', points: foodPoints }
      : foodPoints >= 8
        ? {
            label: 'accès parfois difficile à la nourriture',
            points: foodPoints,
          }
        : null,
    healthPoints === 10
      ? { label: 'accès très difficile aux soins', points: healthPoints }
      : healthPoints >= 5
        ? { label: 'accès difficile aux soins', points: healthPoints }
        : null,
    savingsPoints >= 8
      ? { label: 'aucune épargne disponible', points: savingsPoints }
      : savingsPoints >= 5
        ? { label: 'épargne très limitée', points: savingsPoints }
        : null,
    debtPoints >= 7
      ? { label: 'dette élevée', points: debtPoints }
      : debtPoints >= 4
        ? { label: "niveau d'endettement notable", points: debtPoints }
        : null,
    employmentSearchPoints >= 8
      ? {
          label: 'sans emploi depuis plus de 12 mois',
          points: employmentSearchPoints,
        }
      : employmentSearchPoints >= 6
        ? {
            label: 'sans emploi depuis 6 à 12 mois',
            points: employmentSearchPoints,
          }
        : employmentSearchPoints >= 4
          ? {
              label: 'sans emploi depuis 3 à 6 mois',
              points: employmentSearchPoints,
            }
          : null,
    recentShockPoints >= 8
      ? { label: 'catastrophe ou sinistre récent', points: recentShockPoints }
      : recentShockPoints >= 6
        ? {
            label: 'choc récent sur les revenus ou la famille',
            points: recentShockPoints,
          }
        : recentShockPoints >= 4
          ? { label: 'événement difficile récent', points: recentShockPoints }
          : null,
    disabilityPoints > 0
      ? {
          label: 'limitation ou handicap impactant les activités',
          points: disabilityPoints,
        }
      : null,
  ]
    .filter((item): item is { label: string; points: number } => Boolean(item))
    .sort((first, second) => second.points - first.points);

  const fallbackUrgentNeeds = (input.urgentNeeds ?? []).map((need) => {
    const label =
      {
        food: 'besoin urgent en alimentation',
        health: 'besoin urgent en santé',
        housing: 'besoin urgent en logement',
        employment: 'besoin urgent en emploi',
        financing: 'besoin urgent en financement',
        training: 'besoin urgent en formation',
        schooling: 'besoin urgent en scolarité',
        social_support: 'besoin urgent en accompagnement social',
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

  const uniqueFactors = Array.from(
    new Set(factors.map((item) => item.label)),
  ).slice(0, 5);

  let indigenceLevel: IndigenceAssessment['indigenceLevel'] = 'faible';
  if (total >= 75) {
    indigenceLevel = 'critique';
  } else if (total >= 50) {
    indigenceLevel = 'forte';
  } else if (total >= 25) {
    indigenceLevel = 'moderee';
  }

  return {
    indigenceFactors: uniqueFactors,
    indigenceLevel,
    indigenceScore: total,
  };
}
