import { Injectable } from '@nestjs/common';

import { SupabaseDataService } from '../infra/supabase-data.service';

@Injectable()
export class DashboardService {
  constructor(private readonly supabaseDataService: SupabaseDataService) {}

  async overview(accessToken: string) {
    const client = this.supabaseDataService.forUser(accessToken);
    const { data: rows, error } = await client
      .from('member')
      .select('status, created_at');
    if (error) {
      throw error;
    }

    const members = rows ?? [];
    const totalMembers = members.length;

    const statusCounts = new Map<string, number>();
    let createdThisMonthResult = 0;
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);

    for (const member of members) {
      const status =
        typeof member.status === 'string' ? member.status.trim().toLowerCase() : '';
      if (status) {
        statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1);
      }

      if (member.created_at) {
        const createdAt = new Date(member.created_at);
        if (!Number.isNaN(createdAt.getTime()) && createdAt >= monthStart) {
          createdThisMonthResult += 1;
        }
      }
    }

    const pendingMembers =
      (statusCounts.get('pending') ?? 0) +
      (statusCounts.get('en_attente') ?? 0) +
      (statusCounts.get('waiting') ?? 0);

    const suspendedMembers =
      (statusCounts.get('suspended') ?? 0) +
      (statusCounts.get('suspendu') ?? 0) +
      (statusCounts.get('blocked') ?? 0);

    const activeMembers =
      (statusCounts.get('active') ?? 0) +
      (statusCounts.get('approved') ?? 0) +
      (statusCounts.get('validated') ?? 0) +
      (statusCounts.get('valide') ?? 0) ||
      Math.max(totalMembers - pendingMembers - suspendedMembers, 0);

    return {
      active_members: activeMembers,
      pending_members: pendingMembers,
      suspended_members: suspendedMembers,
      total_members: totalMembers,
      trend_new_this_month: createdThisMonthResult,
    };
  }
}
