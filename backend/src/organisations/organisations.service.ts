import { BadRequestException, Injectable } from '@nestjs/common';

import type { Json } from '../infra/database.types';
import { SupabaseDataService } from '../infra/supabase-data.service';
import { CreateOrganisationDto } from './dto/create-organisation.dto';

type OrganisationItem = {
  category: string;
  id: string;
  members: number;
  name: string;
};

@Injectable()
export class OrganisationsService {
  constructor(private readonly supabaseDataService: SupabaseDataService) {}

  async list(accessToken: string, search?: string) {
    const client = this.supabaseDataService.forUser(accessToken);

    const organisationTable = await this.readOrganisationTable(
      client,
      'organisation',
    );
    if (organisationTable) {
      return this.filterBySearch(
        {
          can_create: true,
          items: organisationTable,
          source: 'public.organisation',
          source_note: null,
        },
        search,
      );
    }

    const organizationTable = await this.readOrganisationTable(
      client,
      'organization',
    );
    if (organizationTable) {
      return this.filterBySearch(
        {
          can_create: true,
          items: organizationTable,
          source: 'public.organization',
          source_note: null,
        },
        search,
      );
    }

    const fromMembers = await this.deriveFromMembers(client);
    return this.filterBySearch(
      {
        can_create: false,
        items: fromMembers,
        source: 'public.member',
        source_note:
          "Aucune table organisation detectee. Appliquez le script SQL 'sql/2026-02-21_create_organisation_table.sql'.",
      },
      search,
    );
  }

  async create(accessToken: string, payload: CreateOrganisationDto) {
    const client = this.supabaseDataService.forUser(accessToken);
    const normalizedName = payload.name.trim();
    if (!normalizedName) {
      throw new BadRequestException('Organisation name is required.');
    }

    const payloads: Array<Record<string, Json | null | undefined>> = [
      { category: payload.type, name: normalizedName },
      { name: normalizedName, type: payload.type },
      { org_name: normalizedName, profile_type: payload.type },
      { title: normalizedName, type: payload.type },
      { name: normalizedName },
    ];

    const firstTry = await this.tryInsert(client, 'organisation', payloads);
    if (firstTry.ok)
      return {
        created_in: 'public.organisation',
        message: 'Organisation created.',
      };
    if (firstTry.error && !firstTry.tableMissing)
      throw new BadRequestException(firstTry.error);

    const secondTry = await this.tryInsert(client, 'organization', payloads);
    if (secondTry.ok)
      return {
        created_in: 'public.organization',
        message: 'Organisation created.',
      };
    if (secondTry.error && !secondTry.tableMissing)
      throw new BadRequestException(secondTry.error);

    throw new BadRequestException(
      'Aucune table organisation/organization detectee. Creation impossible pour le moment.',
    );
  }

  private async readOrganisationTable(
    client: ReturnType<SupabaseDataService['forUser']>,
    tableName: 'organisation' | 'organization',
  ): Promise<OrganisationItem[] | null> {
    const { data, error } = await client.from(tableName).select('*').limit(200);
    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205') {
        return null;
      }
      throw error;
    }

    const items = (data ?? [])
      .map((row, index) =>
        this.toOrganisationItem(row as Record<string, unknown>, index),
      )
      .filter((item): item is OrganisationItem => Boolean(item));
    return this.sortItems(items);
  }

  private async deriveFromMembers(
    client: ReturnType<SupabaseDataService['forUser']>,
  ): Promise<OrganisationItem[]> {
    const { data, error } = await client
      .from('member')
      .select('id, join_mode, org_name, association_name, enterprise_name');

    if (error) {
      throw error;
    }

    const grouped = new Map<string, OrganisationItem>();
    for (const row of (data ?? []) as unknown as Record<string, unknown>[]) {
      const joinMode = this.text(row.join_mode).toLowerCase();
      const associationName = this.text(row.association_name);
      const enterpriseName = this.text(row.enterprise_name);
      const orgName = this.text(row.org_name);
      const name = associationName || enterpriseName || orgName;

      if (!name || joinMode === 'personal') continue;

      const key = name.toLowerCase();
      const category =
        associationName || joinMode === 'association'
          ? 'Association'
          : enterpriseName || joinMode === 'enterprise'
            ? 'Entreprise'
            : 'Organisation';

      const existing = grouped.get(key);
      if (existing) {
        existing.members += 1;
      } else {
        grouped.set(key, {
          category,
          id: this.text(row.id) || `${key.replaceAll(' ', '-')}-0`,
          members: 1,
          name,
        });
      }
    }

    return this.sortItems(Array.from(grouped.values()));
  }

  private async tryInsert(
    client: ReturnType<SupabaseDataService['forUser']>,
    tableName: 'organisation' | 'organization',
    payloads: Array<Record<string, Json | null | undefined>>,
  ): Promise<{ error: string | null; ok: boolean; tableMissing: boolean }> {
    let schemaError: string | null = null;

    for (const payload of payloads) {
      const { error } = await client.from(tableName).insert(payload);
      if (!error) return { error: null, ok: true, tableMissing: false };
      if (error.code === '42P01' || error.code === 'PGRST205') {
        return { error: null, ok: false, tableMissing: true };
      }
      if (error.code === '42703' || error.code === '23502') {
        schemaError = error.message;
        continue;
      }
      return { error: error.message, ok: false, tableMissing: false };
    }

    return {
      error: schemaError
        ? `Schema organisation incompatible pour insertion MVP: ${schemaError}`
        : 'Insertion impossible.',
      ok: false,
      tableMissing: false,
    };
  }

  private filterBySearch<T extends { items: OrganisationItem[] }>(
    data: T,
    search?: string,
  ): T {
    const normalizedSearch = this.text(search).toLowerCase();
    if (!normalizedSearch) return data;
    return {
      ...data,
      items: data.items.filter((item) =>
        `${item.name} ${item.category}`
          .toLowerCase()
          .includes(normalizedSearch),
      ),
    };
  }

  private toOrganisationItem(
    row: Record<string, unknown>,
    index: number,
  ): OrganisationItem | null {
    const name =
      this.text(row.name) ||
      this.text(row.org_name) ||
      this.text(row.organization_name) ||
      this.text(row.organisation_name) ||
      this.text(row.title) ||
      this.text(row.label);
    if (!name) return null;

    const categoryRaw =
      this.text(row.type) ||
      this.text(row.category) ||
      this.text(row.profile_type) ||
      'organisation';
    const members =
      this.countValue(row.member_count) ||
      this.countValue(row.members_count) ||
      this.countValue(row.members) ||
      this.countValue(row.total_members);

    return {
      category: this.normalizeCategory(categoryRaw.toLowerCase()),
      id:
        this.text(row.id) ||
        this.text(row.uuid) ||
        `${name.toLowerCase().replaceAll(' ', '-')}-${index}`,
      members,
      name,
    };
  }

  private sortItems(items: OrganisationItem[]): OrganisationItem[] {
    return items.sort((first, second) => {
      if (second.members !== first.members)
        return second.members - first.members;
      return first.name.localeCompare(second.name, 'fr');
    });
  }

  private normalizeCategory(value: string): string {
    if (value === 'association') return 'Association';
    if (value === 'enterprise') return 'Entreprise';
    if (value === 'personal') return 'Personnel';
    return value ? value[0].toUpperCase() + value.slice(1) : 'Organisation';
  }

  private text(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private countValue(value: unknown): number {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue < 0) return 0;
    return Math.floor(numericValue);
  }
}
