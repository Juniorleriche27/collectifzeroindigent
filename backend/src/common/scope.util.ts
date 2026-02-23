import { BadRequestException } from '@nestjs/common';

export type ScopeType = 'all' | 'region' | 'prefecture' | 'commune';

export type ScopeInput = {
  commune_id?: string | null;
  prefecture_id?: string | null;
  region_id?: string | null;
  scope_type: ScopeType;
};

function normalizeUuid(value: string | null | undefined): string | null {
  const normalized = (value ?? '').trim();
  return normalized ? normalized : null;
}

function normalizeScope(scope: ScopeInput): ScopeInput {
  const scopeType = scope.scope_type;

  if (!['all', 'region', 'prefecture', 'commune'].includes(scopeType)) {
    throw new BadRequestException(`scope_type invalide: ${scopeType}`);
  }

  if (scopeType === 'all') {
    return {
      commune_id: null,
      prefecture_id: null,
      region_id: null,
      scope_type: 'all',
    };
  }

  if (scopeType === 'region') {
    const regionId = normalizeUuid(scope.region_id);
    if (!regionId) {
      throw new BadRequestException(
        'region_id est obligatoire pour scope_type=region.',
      );
    }
    return {
      commune_id: null,
      prefecture_id: null,
      region_id: regionId,
      scope_type: 'region',
    };
  }

  if (scopeType === 'prefecture') {
    const prefectureId = normalizeUuid(scope.prefecture_id);
    if (!prefectureId) {
      throw new BadRequestException(
        'prefecture_id est obligatoire pour scope_type=prefecture.',
      );
    }
    return {
      commune_id: null,
      prefecture_id: prefectureId,
      region_id: null,
      scope_type: 'prefecture',
    };
  }

  const communeId = normalizeUuid(scope.commune_id);
  if (!communeId) {
    throw new BadRequestException(
      'commune_id est obligatoire pour scope_type=commune.',
    );
  }
  return {
    commune_id: communeId,
    prefecture_id: null,
    region_id: null,
    scope_type: 'commune',
  };
}

export function normalizeScopes(scopes: ScopeInput[] | undefined): ScopeInput[] {
  const raw: ScopeInput[] = scopes?.length
    ? scopes
    : [{ scope_type: 'all' as const }];
  const normalized = raw.map((scope) => normalizeScope(scope));
  const deduped = new Map<string, ScopeInput>();

  for (const scope of normalized) {
    const key = `${scope.scope_type}:${scope.region_id ?? ''}:${scope.prefecture_id ?? ''}:${scope.commune_id ?? ''}`;
    deduped.set(key, scope);
  }

  return Array.from(deduped.values());
}

export function normalizeSingleScope(input: ScopeInput): ScopeInput {
  return normalizeScope(input);
}
