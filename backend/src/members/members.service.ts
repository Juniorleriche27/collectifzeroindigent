import { Injectable, UnauthorizedException } from '@nestjs/common';

import { SupabaseDataService } from '../infra/supabase-data.service';
import { UpdateMemberDto } from './dto/update-member.dto';

type ListMembersQuery = {
  commune_id?: string;
  page?: string;
  page_size?: string;
  prefecture_id?: string;
  q?: string;
  region_id?: string;
  sort?: string;
  status?: string;
};

@Injectable()
export class MembersService {
  constructor(private readonly supabaseDataService: SupabaseDataService) {}

  async list(accessToken: string, query: ListMembersQuery) {
    const client = this.supabaseDataService.forUser(accessToken);
    const page = this.positiveInt(query.page, 1);
    const pageSize = this.positiveInt(query.page_size, 10, 50);
    const rangeFrom = (page - 1) * pageSize;
    const rangeTo = rangeFrom + pageSize - 1;

    let dbQuery = client
      .from('member')
      .select(
        'id, user_id, first_name, last_name, phone, email, status, region_id, prefecture_id, commune_id, join_mode, org_name, created_at',
        { count: 'exact' },
      )
      .range(rangeFrom, rangeTo);

    const sort = query.sort ?? 'created_desc';
    if (sort === 'name_asc') {
      dbQuery = dbQuery
        .order('last_name', { ascending: true })
        .order('first_name', { ascending: true });
    } else if (sort === 'name_desc') {
      dbQuery = dbQuery
        .order('last_name', { ascending: false })
        .order('first_name', { ascending: false });
    } else if (sort === 'created_asc') {
      dbQuery = dbQuery.order('created_at', { ascending: true });
    } else if (sort === 'status_asc') {
      dbQuery = dbQuery
        .order('status', { ascending: true })
        .order('created_at', { ascending: false });
    } else {
      dbQuery = dbQuery.order('created_at', { ascending: false });
    }

    if (query.status) dbQuery = dbQuery.eq('status', query.status);
    if (query.region_id) dbQuery = dbQuery.eq('region_id', query.region_id);
    if (query.prefecture_id)
      dbQuery = dbQuery.eq('prefecture_id', query.prefecture_id);
    if (query.commune_id) dbQuery = dbQuery.eq('commune_id', query.commune_id);
    if (query.q) {
      const safeSearch = query.q.replaceAll(',', ' ').trim();
      if (safeSearch) {
        dbQuery = dbQuery.or(
          `first_name.ilike.%${safeSearch}%,last_name.ilike.%${safeSearch}%,phone.ilike.%${safeSearch}%,email.ilike.%${safeSearch}%`,
        );
      }
    }

    const { data, error, count } = await dbQuery;
    if (error) {
      throw error;
    }

    return {
      count: count ?? 0,
      page,
      pageSize,
      rows: data ?? [],
    };
  }

  async getById(accessToken: string, memberId: string) {
    const client = this.supabaseDataService.forUser(accessToken);
    const { data, error } = await client
      .from('member')
      .select(
        'id, user_id, first_name, last_name, phone, email, status, region_id, prefecture_id, commune_id, join_mode, org_name, created_at',
      )
      .eq('id', memberId)
      .maybeSingle();

    if (error) {
      throw error;
    }
    return data;
  }

  async getCurrent(accessToken: string) {
    const client = this.supabaseDataService.forUser(accessToken);
    const userId = await this.getCurrentUserId(accessToken);

    const { data, error } = await client
      .from('member')
      .select(
        'id, user_id, first_name, last_name, phone, email, status, region_id, prefecture_id, commune_id, join_mode, org_name, created_at',
      )
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  }

  async update(
    accessToken: string,
    memberId: string,
    payload: UpdateMemberDto,
  ) {
    const client = this.supabaseDataService.forUser(accessToken);
    const normalizedPayload = {
      ...payload,
      email: payload.email || null,
      org_name:
        payload.join_mode && payload.join_mode === 'personal'
          ? null
          : (payload.org_name ?? null),
    };

    const { data, error } = await client
      .from('member')
      .update(normalizedPayload)
      .eq('id', memberId)
      .select(
        'id, user_id, first_name, last_name, phone, email, status, region_id, prefecture_id, commune_id, join_mode, org_name, created_at',
      )
      .maybeSingle();

    if (error) {
      throw error;
    }
    return data;
  }

  async updateCurrent(accessToken: string, payload: UpdateMemberDto) {
    const client = this.supabaseDataService.forUser(accessToken);
    const userId = await this.getCurrentUserId(accessToken);
    const normalizedPayload = {
      ...payload,
      email: payload.email || null,
      org_name:
        payload.join_mode && payload.join_mode === 'personal'
          ? null
          : (payload.org_name ?? null),
    };

    const { data, error } = await client
      .from('member')
      .update(normalizedPayload)
      .eq('user_id', userId)
      .select(
        'id, user_id, first_name, last_name, phone, email, status, region_id, prefecture_id, commune_id, join_mode, org_name, created_at',
      )
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  }

  private positiveInt(
    value: string | undefined,
    fallback: number,
    max = 1000,
  ): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 1) return fallback;
    return Math.min(Math.floor(parsed), max);
  }

  private async getCurrentUserId(accessToken: string): Promise<string> {
    const client = this.supabaseDataService.forUser(accessToken);
    const {
      data: { user },
      error,
    } = await client.auth.getUser();

    if (error || !user) {
      throw new UnauthorizedException('Invalid authenticated session.');
    }

    return user.id;
  }
}
