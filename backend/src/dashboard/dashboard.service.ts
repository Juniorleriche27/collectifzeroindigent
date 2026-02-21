import { Injectable } from '@nestjs/common';

import { SupabaseDataService } from '../infra/supabase-data.service';

@Injectable()
export class DashboardService {
  constructor(private readonly supabaseDataService: SupabaseDataService) {}

  async overview(accessToken: string) {
    const client = this.supabaseDataService.forUser(accessToken);
    const now = new Date();
    const monthStart = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-01`;

    const [
      totalMembers,
      activeMembers,
      pendingMembers,
      suspendedMembers,
      createdThisMonthResult,
    ] = await Promise.all([
      this.countMembers(client),
      this.countMembers(client, (query) => query.eq('status', 'active')),
      this.countMembers(client, (query) => query.eq('status', 'pending')),
      this.countMembers(client, (query) => query.eq('status', 'suspended')),
      this.countMembersSafe(client, (query) => query.gte('created_at', monthStart)),
    ]);

    return {
      active_members: activeMembers,
      pending_members: pendingMembers,
      suspended_members: suspendedMembers,
      total_members: totalMembers,
      trend_new_this_month: createdThisMonthResult,
    };
  }

  private async countMembers(
    client: ReturnType<SupabaseDataService['forUser']>,
    applyFilter?: (query: any) => any,
  ): Promise<number> {
    let query = client.from('member').select('id', { count: 'exact' }).limit(1);
    if (applyFilter) {
      query = applyFilter(query);
    }

    const { count, error } = await query;
    if (error) {
      throw error;
    }
    return count ?? 0;
  }

  private async countMembersSafe(
    client: ReturnType<SupabaseDataService['forUser']>,
    applyFilter?: (query: any) => any,
  ): Promise<number> {
    try {
      return await this.countMembers(client, applyFilter);
    } catch (error) {
      console.error('Dashboard month count fallback to 0', error);
      return 0;
    }
  }
}
