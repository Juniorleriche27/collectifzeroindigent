import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import {
  getCurrentMemberId,
  getProfileRoleByUserId,
  requireUserId,
} from '../common/supabase-auth-context';
import type { Database } from '../infra/database.types';
import { SupabaseDataService } from '../infra/supabase-data.service';
import { CreateDonationDto } from './dto/create-donation.dto';
import { UpdateDonationDto } from './dto/update-donation.dto';

type DonationRow = Database['public']['Tables']['donation']['Row'];
type DonationInsert = Database['public']['Tables']['donation']['Insert'];
type DonationUpdate = Database['public']['Tables']['donation']['Update'];

type DonationListQuery = {
  q?: string;
  status?: string;
};

const MANAGER_ROLES = new Set(['admin', 'ca', 'cn', 'pf']);
const DONATION_STATUSES = new Set([
  'pledged',
  'pending',
  'paid',
  'failed',
  'cancelled',
  'refunded',
]);

@Injectable()
export class DonationsService {
  constructor(private readonly supabaseDataService: SupabaseDataService) {}

  private readonly donationSelect =
    'id, user_id, member_id, amount_cfa, currency, message, status, payment_provider, payment_ref, paid_at, created_at, updated_at';

  async list(accessToken: string, query: DonationListQuery) {
    const client = this.supabaseDataService.forUser(accessToken);
    const userId = await requireUserId(client);
    const role = await getProfileRoleByUserId(client, userId);
    const canManage = MANAGER_ROLES.has(role);

    const status = this.normalizeStatus(query.status);
    if (status && !DONATION_STATUSES.has(status)) {
      throw new BadRequestException('Statut de don invalide.');
    }

    let dbQuery = client
      .from('donation')
      .select(this.donationSelect)
      .order('created_at', { ascending: false })
      .limit(300);

    if (!canManage) {
      dbQuery = dbQuery.eq('user_id', userId);
    }

    if (status) {
      dbQuery = dbQuery.eq('status', status);
    }

    const search = (query.q ?? '').replaceAll(',', ' ').trim();
    if (search) {
      dbQuery = dbQuery.or(
        `message.ilike.%${search}%,payment_ref.ilike.%${search}%,payment_provider.ilike.%${search}%`,
      );
    }

    const { data, error } = await dbQuery;
    if (error) {
      throw error;
    }

    const items = (data ?? []) as DonationRow[];

    const summary = items.reduce(
      (accumulator, item) => {
        accumulator.count += 1;
        accumulator.total_amount_cfa += item.amount_cfa ?? 0;

        if (item.status === 'paid') {
          accumulator.paid_amount_cfa += item.amount_cfa ?? 0;
          accumulator.paid_count += 1;
        }

        if (item.status === 'pending' || item.status === 'pledged') {
          accumulator.pending_count += 1;
        }

        return accumulator;
      },
      {
        count: 0,
        paid_amount_cfa: 0,
        paid_count: 0,
        pending_count: 0,
        total_amount_cfa: 0,
      },
    );

    return {
      can_manage: canManage,
      items,
      role,
      summary,
    };
  }

  async create(accessToken: string, payload: CreateDonationDto) {
    const client = this.supabaseDataService.forUser(accessToken);
    const userId = await requireUserId(client);
    const memberId = await getCurrentMemberId(client, userId);

    const amount = Number(payload.amount_cfa);
    if (!Number.isFinite(amount) || amount < 100) {
      throw new BadRequestException('Le montant minimum est 100 CFA.');
    }

    const insertPayload: DonationInsert = {
      amount_cfa: Math.floor(amount),
      currency: 'XOF',
      member_id: memberId,
      message: payload.message?.trim() || null,
      payment_provider: payload.payment_provider?.trim() || null,
      status: 'pending',
      user_id: userId,
    };

    const { data, error } = await client
      .from('donation')
      .insert(insertPayload)
      .select(this.donationSelect)
      .single();

    if (error || !data) {
      throw (
        error ?? new BadRequestException("Impossible d'enregistrer ce don.")
      );
    }

    return {
      item: data as DonationRow,
      message:
        'Don enregistre. Passez au paiement pour finaliser la transaction.',
    };
  }

  async update(
    accessToken: string,
    donationId: string,
    payload: UpdateDonationDto,
  ) {
    const client = this.supabaseDataService.forUser(accessToken);
    const userId = await requireUserId(client);
    const role = await getProfileRoleByUserId(client, userId);
    const canManage = MANAGER_ROLES.has(role);

    const { data: existing, error: existingError } = await client
      .from('donation')
      .select(this.donationSelect)
      .eq('id', donationId)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }
    if (!existing) {
      throw new BadRequestException('Don introuvable ou non visible.');
    }

    const updatePayload: DonationUpdate = {};
    const requestedStatus = this.normalizeStatus(payload.status);
    if (requestedStatus && !DONATION_STATUSES.has(requestedStatus)) {
      throw new BadRequestException('Statut de don invalide.');
    }

    if (canManage) {
      if (requestedStatus) {
        updatePayload.status = requestedStatus;
        if (requestedStatus === 'paid') {
          updatePayload.paid_at = new Date().toISOString();
        }
      }
      if (payload.message !== undefined) {
        updatePayload.message = payload.message.trim() || null;
      }
      if (payload.payment_provider !== undefined) {
        updatePayload.payment_provider =
          payload.payment_provider.trim() || null;
      }
      if (payload.payment_ref !== undefined) {
        updatePayload.payment_ref = payload.payment_ref.trim() || null;
      }
    } else {
      if (existing.user_id !== userId) {
        throw new ForbiddenException('Vous ne pouvez modifier que vos dons.');
      }

      if (
        payload.payment_provider !== undefined ||
        payload.payment_ref !== undefined
      ) {
        throw new ForbiddenException(
          'La mise a jour des informations de paiement est reservee a la gestion.',
        );
      }

      if (requestedStatus !== undefined) {
        if (requestedStatus !== 'cancelled') {
          throw new ForbiddenException(
            'Vous pouvez uniquement annuler un don en attente.',
          );
        }
        if (existing.status !== 'pending' && existing.status !== 'pledged') {
          throw new BadRequestException(
            'Seuls les dons en attente peuvent etre annules.',
          );
        }
        updatePayload.status = 'cancelled';
      }

      if (payload.message !== undefined) {
        updatePayload.message = payload.message.trim() || null;
      }
    }

    if (Object.keys(updatePayload).length === 0) {
      throw new BadRequestException('Aucune modification fournie.');
    }

    const { data, error } = await client
      .from('donation')
      .update(updatePayload)
      .eq('id', donationId)
      .select(this.donationSelect)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return {
      item: (data ?? existing) as DonationRow,
      message: 'Don mis a jour.',
    };
  }

  private normalizeStatus(value: string | undefined): string | undefined {
    const normalized = (value ?? '').trim().toLowerCase();
    return normalized || undefined;
  }
}
