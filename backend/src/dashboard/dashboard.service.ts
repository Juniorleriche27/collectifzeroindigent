import { Injectable } from '@nestjs/common';

import { SupabaseDataService } from '../infra/supabase-data.service';

@Injectable()
export class DashboardService {
  constructor(private readonly supabaseDataService: SupabaseDataService) {}

  async overview(accessToken: string) {
    const client = this.supabaseDataService.forUser(accessToken);
    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);

    const [
      totalMembers,
      activeMembers,
      pendingMembers,
      suspendedMembers,
      createdThisMonth,
    ] = await Promise.all([
      this.countMembers(client),
      this.countMembers(client, (query) => query.eq('status', 'active')),
      this.countMembers(client, (query) => query.eq('status', 'pending')),
      this.countMembers(client, (query) => query.eq('status', 'suspended')),
      this.countMembers(client, (query) =>
        query.gte('created_at', startOfMonth.toISOString()),
      ),
    ]);

    return {
      active_members: activeMembers,
      pending_members: pendingMembers,
      suspended_members: suspendedMembers,
      total_members: totalMembers,
      trend_new_this_month: createdThisMonth,
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
}
