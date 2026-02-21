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
      totalMembersResult,
      activeMembersResult,
      pendingMembersResult,
      suspendedMembersResult,
      createdThisMonthResult,
    ] = await Promise.all([
      client.from('member').select('id', { count: 'exact', head: true }),
      client
        .from('member')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active'),
      client
        .from('member')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
      client
        .from('member')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'suspended'),
      client
        .from('member')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString()),
    ]);

    if (totalMembersResult.error) throw totalMembersResult.error;
    if (activeMembersResult.error) throw activeMembersResult.error;
    if (pendingMembersResult.error) throw pendingMembersResult.error;
    if (suspendedMembersResult.error) throw suspendedMembersResult.error;
    if (createdThisMonthResult.error) throw createdThisMonthResult.error;

    return {
      active_members: activeMembersResult.count ?? 0,
      pending_members: pendingMembersResult.count ?? 0,
      suspended_members: suspendedMembersResult.count ?? 0,
      total_members: totalMembersResult.count ?? 0,
      trend_new_this_month: createdThisMonthResult.count ?? 0,
    };
  }
}
