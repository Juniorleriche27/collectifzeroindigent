import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  getProfileRoleByUserId,
  requireUserId,
} from '../common/supabase-auth-context';
import type { Database } from '../infra/database.types';
import { SupabaseDataService } from '../infra/supabase-data.service';
import { CreatePaydunyaCheckoutDto } from './dto/create-paydunya-checkout.dto';

type DonationRow = Database['public']['Tables']['donation']['Row'];
type MemberCardRequestRow =
  Database['public']['Tables']['member_card_request']['Row'];
type MemberRow = Database['public']['Tables']['member']['Row'];

type MemberCardCheckoutLookup = Pick<
  MemberCardRequestRow,
  | 'card_status'
  | 'id'
  | 'member_id'
  | 'payment_status'
  | 'price_cfa'
  | 'requested'
>;
type MemberPaymentOwnerLookup = Pick<MemberRow, 'photo_status' | 'user_id'>;

type LocalPaymentStatus = 'failed' | 'paid' | 'pending';
type PaydunyaTargetType = 'donation' | 'member_card_request';

type PaydunyaCheckoutResponse = {
  invoice?: {
    status?: string;
    token?: string;
    url?: string;
  };
  invoice_url?: string;
  redirect_url?: string;
  response_code?: string | number;
  response_text?: string;
  status?: string;
  token?: string;
};

type PaymentSyncResult = {
  memberCardRequestUpdates: number;
  paymentStatus: LocalPaymentStatus;
  providerStatusText: string;
  token: string;
  updatedDonations: number;
};

type CreateCheckoutArgs = {
  amountCfa: number;
  customData: Record<string, string | null>;
  customerEmail?: string;
  customerName?: string;
  description: string;
  itemName: string;
  targetId: string;
  targetType: PaydunyaTargetType;
};

const MANAGER_ROLES = new Set(['admin', 'ca', 'cn', 'pf']);

@Injectable()
export class PaydunyaService {
  private readonly logger = new Logger(PaydunyaService.name);

  constructor(
    private readonly supabaseDataService: SupabaseDataService,
    private readonly configService: ConfigService,
  ) {}

  async createDonationCheckout(
    accessToken: string,
    donationId: string,
    payload: CreatePaydunyaCheckoutDto,
  ) {
    const client = this.supabaseDataService.forUser(accessToken);
    const userId = await requireUserId(client);
    const role = await getProfileRoleByUserId(client, userId);
    const canManage = MANAGER_ROLES.has(role);

    const { data: donation, error } = await client
      .from('donation')
      .select('id, user_id, amount_cfa, status, message')
      .eq('id', donationId)
      .maybeSingle();

    if (error) {
      throw error;
    }
    if (!donation) {
      throw new BadRequestException('Don introuvable ou non visible.');
    }
    if (!canManage && donation.user_id !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez lancer le paiement que pour votre propre don.',
      );
    }
    if (donation.status === 'paid' || donation.status === 'refunded') {
      throw new BadRequestException('Ce don est deja finalise.');
    }

    const checkout = await this.createCheckoutInvoice({
      amountCfa: donation.amount_cfa,
      customData: {
        donation_id: donation.id,
        target_id: donation.id,
        target_type: 'donation',
        user_id: donation.user_id,
      },
      customerEmail: payload.customer_email,
      customerName: payload.customer_name,
      description:
        payload.description?.trim() ||
        donation.message?.trim() ||
        `Don CZI #${donation.id}`,
      itemName: 'Don CZI',
      targetId: donation.id,
      targetType: 'donation',
    });

    const adminClient = this.supabaseDataService.admin();
    const { error: updateError } = await adminClient
      .from('donation')
      .update({
        payment_provider: 'paydunya',
        payment_ref: checkout.token,
        status: 'pending',
      })
      .eq('id', donation.id);

    if (updateError) {
      throw updateError;
    }

    return {
      cancel_url: checkout.cancelUrl,
      callback_url: checkout.callbackUrl,
      invoice_url: checkout.invoiceUrl,
      ipn_url: this.resolveIpnUrl(),
      message:
        'Lien de paiement PayDunya genere. Redirigez le membre vers invoice_url.',
      token: checkout.token,
    };
  }

  async createMemberCardRequestCheckout(
    accessToken: string,
    cardRequestId: string,
    payload: CreatePaydunyaCheckoutDto,
  ) {
    const client = this.supabaseDataService.forUser(accessToken);
    const userId = await requireUserId(client);
    const role = await getProfileRoleByUserId(client, userId);
    const canManage = MANAGER_ROLES.has(role);

    const { data: cardRequestRaw, error } = await client
      .from('member_card_request')
      .select(
        'id, member_id, requested, price_cfa, payment_status, card_status',
      )
      .eq('id', cardRequestId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    const cardRequest = cardRequestRaw as MemberCardCheckoutLookup | null;
    if (!cardRequest) {
      throw new BadRequestException(
        'Demande de carte introuvable ou non visible.',
      );
    }

    const { data: memberRaw, error: memberError } = await client
      .from('member')
      .select('user_id, photo_status')
      .eq('id', cardRequest.member_id)
      .maybeSingle();

    if (memberError) {
      throw memberError;
    }

    const member = memberRaw as MemberPaymentOwnerLookup | null;
    const memberUserId = member?.user_id ?? '';
    const memberPhotoStatus = member?.photo_status ?? 'missing';

    if (!canManage && memberUserId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez lancer le paiement que pour votre demande de carte.',
      );
    }

    if (!cardRequest.requested) {
      throw new BadRequestException(
        "La demande doit etre marquee 'requested=true' avant paiement.",
      );
    }
    if (cardRequest.payment_status === 'paid') {
      throw new BadRequestException('Cette carte est deja payee.');
    }
    if (cardRequest.card_status === 'cancelled') {
      throw new BadRequestException(
        'Cette demande de carte est annulee et ne peut plus etre payee.',
      );
    }

    const checkout = await this.createCheckoutInvoice({
      amountCfa: cardRequest.price_cfa,
      customData: {
        member_card_request_id: cardRequest.id,
        member_id: cardRequest.member_id,
        target_id: cardRequest.id,
        target_type: 'member_card_request',
      },
      customerEmail: payload.customer_email,
      customerName: payload.customer_name,
      description:
        payload.description?.trim() ||
        `Carte de membre CZI (${memberPhotoStatus})`,
      itemName: 'Carte de membre CZI',
      targetId: cardRequest.id,
      targetType: 'member_card_request',
    });

    const adminClient = this.supabaseDataService.admin();
    const { error: updateError } = await adminClient
      .from('member_card_request')
      .update({
        payment_provider: 'paydunya',
        payment_ref: checkout.token,
        payment_status: 'pending',
        requested: true,
      })
      .eq('id', cardRequest.id);

    if (updateError) {
      throw updateError;
    }

    return {
      cancel_url: checkout.cancelUrl,
      callback_url: checkout.callbackUrl,
      invoice_url: checkout.invoiceUrl,
      ipn_url: this.resolveIpnUrl(),
      message:
        'Lien de paiement carte genere. La carte passera en ready automatiquement apres paiement + photo.',
      token: checkout.token,
    };
  }

  async confirmAndSyncByToken(tokenRaw: string): Promise<PaymentSyncResult> {
    const token = tokenRaw.trim();
    if (!token) {
      throw new BadRequestException('Token PayDunya manquant.');
    }

    const providerPayload = await this.fetchInvoiceConfirmation(token);
    return this.applyStatusFromProviderPayload(token, providerPayload);
  }

  async handleIpn(rawPayload: unknown): Promise<{
    message: string;
    processed: boolean;
    result: PaymentSyncResult | null;
    token: string | null;
  }> {
    const token = this.extractTokenFromIpnPayload(rawPayload);
    if (!token) {
      this.logger.warn('PayDunya IPN recu sans token exploitable.');
      return {
        message: 'IPN recu sans token exploitable.',
        processed: false,
        result: null,
        token: null,
      };
    }

    const result = await this.confirmAndSyncByToken(token);
    return {
      message: 'IPN PayDunya traite.',
      processed: true,
      result,
      token,
    };
  }

  private async createCheckoutInvoice(args: CreateCheckoutArgs): Promise<{
    callbackUrl: string;
    cancelUrl: string;
    invoiceUrl: string;
    token: string;
  }> {
    const callbackUrl = this.buildTargetUrl(
      this.resolveCallbackUrl(),
      args.targetType,
      args.targetId,
    );
    const cancelUrl = this.buildTargetUrl(
      this.resolveCancelUrl(),
      args.targetType,
      args.targetId,
    );

    const checkoutPayload = {
      actions: {
        callback_url: callbackUrl,
        cancel_url: cancelUrl,
      },
      custom_data: {
        ...args.customData,
        customer_email: args.customerEmail?.trim() || null,
        customer_name: args.customerName?.trim() || null,
      },
      invoice: {
        description: args.description,
        items: [
          {
            description: args.description,
            name: args.itemName,
            quantity: 1,
            total_price: args.amountCfa,
            unit_price: args.amountCfa,
          },
        ],
        total_amount: args.amountCfa,
      },
      store: this.readStoreSettings(),
    };

    const response = await fetch(this.createCheckoutUrl(), {
      body: JSON.stringify(checkoutPayload),
      headers: this.paydunyaHeaders(),
      method: 'POST',
    });

    const rawBody = await response.text();
    const providerPayload = this.asRecord(this.safeJsonParse(rawBody));

    if (!response.ok) {
      throw new BadRequestException(
        `PayDunya checkout error (${response.status}): ${this.providerErrorText(providerPayload)}`,
      );
    }

    const token = this.extractCheckoutToken(providerPayload);
    const invoiceUrl = this.extractCheckoutInvoiceUrl(providerPayload);
    if (!token || !invoiceUrl) {
      throw new BadRequestException(
        'PayDunya n a pas retourne token/invoice_url attendus.',
      );
    }

    return {
      callbackUrl,
      cancelUrl,
      invoiceUrl,
      token,
    };
  }

  private async fetchInvoiceConfirmation(
    token: string,
  ): Promise<Record<string, unknown>> {
    const response = await fetch(this.confirmCheckoutUrl(token), {
      headers: this.paydunyaHeaders(),
      method: 'GET',
    });

    const rawBody = await response.text();
    const payload = this.asRecord(this.safeJsonParse(rawBody));

    if (!response.ok || Object.keys(payload).length === 0) {
      throw new BadRequestException(
        `PayDunya confirm error (${response.status}).`,
      );
    }

    return payload;
  }

  private async applyStatusFromProviderPayload(
    token: string,
    providerPayload: Record<string, unknown>,
  ): Promise<PaymentSyncResult> {
    const localStatus = this.deriveLocalPaymentStatus(providerPayload);
    const statusText = this.extractProviderStatusText(providerPayload);
    const nowIso = new Date().toISOString();

    const adminClient = this.supabaseDataService.admin();

    const { data: donations, error: donationsError } = await adminClient
      .from('donation')
      .select('id, status')
      .eq('payment_ref', token);

    if (donationsError) {
      throw donationsError;
    }

    let updatedDonations = 0;
    for (const row of (donations ?? []) as Pick<
      DonationRow,
      'id' | 'status'
    >[]) {
      const updatePayload = this.computeDonationStatusUpdate(
        localStatus,
        row.status,
        nowIso,
      );
      if (!updatePayload) continue;

      const { error } = await adminClient
        .from('donation')
        .update(updatePayload)
        .eq('id', row.id);

      if (error) {
        throw error;
      }
      updatedDonations += 1;
    }

    const { data: memberCardRequests, error: cardError } = await adminClient
      .from('member_card_request')
      .select('id, payment_status')
      .eq('payment_ref', token);

    if (cardError) {
      throw cardError;
    }

    let memberCardRequestUpdates = 0;
    for (const row of (memberCardRequests ?? []) as Pick<
      MemberCardRequestRow,
      'id' | 'payment_status'
    >[]) {
      const updatePayload = this.computeCardPaymentStatusUpdate(
        localStatus,
        row.payment_status,
      );
      if (!updatePayload) continue;

      const { error } = await adminClient
        .from('member_card_request')
        .update(updatePayload)
        .eq('id', row.id);

      if (error) {
        throw error;
      }
      memberCardRequestUpdates += 1;
    }

    return {
      memberCardRequestUpdates,
      paymentStatus: localStatus,
      providerStatusText: statusText,
      token,
      updatedDonations,
    };
  }

  private computeDonationStatusUpdate(
    localStatus: LocalPaymentStatus,
    currentStatus: string,
    nowIso: string,
  ): Database['public']['Tables']['donation']['Update'] | null {
    if (localStatus === 'paid') {
      if (currentStatus === 'paid' || currentStatus === 'refunded') {
        return null;
      }
      return {
        paid_at: nowIso,
        payment_provider: 'paydunya',
        status: 'paid',
      };
    }

    if (localStatus === 'failed') {
      if (currentStatus === 'paid' || currentStatus === 'refunded') {
        return null;
      }
      return {
        payment_provider: 'paydunya',
        status: 'failed',
      };
    }

    if (currentStatus === 'paid' || currentStatus === 'refunded') {
      return null;
    }
    if (currentStatus === 'pending') {
      return null;
    }

    return {
      payment_provider: 'paydunya',
      status: 'pending',
    };
  }

  private computeCardPaymentStatusUpdate(
    localStatus: LocalPaymentStatus,
    currentStatus: string,
  ): Database['public']['Tables']['member_card_request']['Update'] | null {
    if (localStatus === 'paid') {
      if (currentStatus === 'paid') {
        return null;
      }
      return {
        payment_provider: 'paydunya',
        payment_status: 'paid',
      };
    }

    if (localStatus === 'failed') {
      if (currentStatus === 'paid') {
        return null;
      }
      return {
        payment_provider: 'paydunya',
        payment_status: 'failed',
      };
    }

    if (currentStatus === 'paid' || currentStatus === 'pending') {
      return null;
    }

    return {
      payment_provider: 'paydunya',
      payment_status: 'pending',
    };
  }

  private paydunyaHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'PAYDUNYA-MASTER-KEY': this.requireEnv('PAYDUNYA_MASTER_KEY'),
      'PAYDUNYA-MODE': this.readMode(),
      'PAYDUNYA-PRIVATE-KEY': this.requireEnv('PAYDUNYA_PRIVATE_KEY'),
      'PAYDUNYA-TOKEN': this.requireEnv('PAYDUNYA_TOKEN'),
    };
  }

  private readMode(): string {
    const mode = (this.configService.get<string>('PAYDUNYA_MODE') || 'test')
      .trim()
      .toLowerCase();
    if (mode !== 'test' && mode !== 'live') {
      return 'test';
    }
    return mode;
  }

  private createCheckoutUrl(): string {
    return `${this.readBaseUrl()}/checkout-invoice/create`;
  }

  private confirmCheckoutUrl(token: string): string {
    return `${this.readBaseUrl()}/checkout-invoice/confirm/${encodeURIComponent(token)}`;
  }

  private readBaseUrl(): string {
    const configured =
      this.configService.get<string>('PAYDUNYA_BASE_URL')?.trim() ||
      'https://app.paydunya.com/api/v1';
    return configured.replace(/\/+$/, '');
  }

  private readStoreSettings() {
    const website =
      this.configService.get<string>('PAYDUNYA_STORE_WEBSITE_URL')?.trim() ||
      'https://reseauczi.org/';

    return {
      name:
        this.configService.get<string>('PAYDUNYA_STORE_NAME')?.trim() || 'CZI',
      phone_number:
        this.configService.get<string>('PAYDUNYA_STORE_PHONE')?.trim() || null,
      tagline:
        this.configService.get<string>('PAYDUNYA_STORE_TAGLINE')?.trim() ||
        'Paiements CZI',
      website_url: website,
    };
  }

  private resolveCallbackUrl(): string {
    return (
      this.configService.get<string>('PAYDUNYA_CALLBACK_URL')?.trim() ||
      `${this.resolveFrontendBaseUrl()}/app/dons?payment=callback`
    );
  }

  private resolveCancelUrl(): string {
    return (
      this.configService.get<string>('PAYDUNYA_CANCEL_URL')?.trim() ||
      `${this.resolveFrontendBaseUrl()}/app/dons?payment=cancelled`
    );
  }

  private resolveFrontendBaseUrl(): string {
    const fallback =
      this.configService.get<string>('FRONTEND_PUBLIC_URL')?.trim() ||
      this.configService.get<string>('NEXT_PUBLIC_SITE_URL')?.trim() ||
      this.configService.get<string>('NEXT_PUBLIC_VERCEL_URL')?.trim();

    if (!fallback) {
      throw new BadRequestException(
        'URL frontend manquante. Definissez FRONTEND_PUBLIC_URL (ou PAYDUNYA_CALLBACK_URL/CANCEL_URL).',
      );
    }

    return this.ensureAbsoluteUrl(fallback);
  }

  private resolveIpnUrl(): string {
    const explicit = this.configService.get<string>('PAYDUNYA_IPN_URL')?.trim();
    if (explicit) {
      return this.ensureAbsoluteUrl(explicit);
    }

    const backendBase =
      this.configService.get<string>('BACKEND_PUBLIC_URL')?.trim() ||
      this.configService.get<string>('BACKEND_URL')?.trim() ||
      this.configService.get<string>('NEXT_PUBLIC_BACKEND_URL')?.trim();

    if (!backendBase) {
      throw new BadRequestException(
        'URL backend publique manquante. Definissez PAYDUNYA_IPN_URL ou BACKEND_PUBLIC_URL.',
      );
    }

    const normalizedBase = this.ensureAbsoluteUrl(backendBase);
    if (normalizedBase.endsWith('/api')) {
      return `${normalizedBase}/payments/paydunya/ipn`;
    }
    return `${normalizedBase}/api/payments/paydunya/ipn`;
  }

  private buildTargetUrl(
    baseUrl: string,
    targetType: PaydunyaTargetType,
    targetId: string,
  ): string {
    const url = new URL(baseUrl);
    url.searchParams.set('payment_target', targetType);
    url.searchParams.set('payment_target_id', targetId);
    return url.toString();
  }

  private ensureAbsoluteUrl(rawValue: string): string {
    const value = rawValue.trim();
    if (!value) {
      throw new BadRequestException('URL vide.');
    }
    const normalized = value.startsWith('http') ? value : `https://${value}`;
    const parsed = new URL(normalized);
    return parsed.toString().replace(/\/+$/, '');
  }

  private deriveLocalPaymentStatus(
    payload: Record<string, unknown>,
  ): LocalPaymentStatus {
    const statusText = this.extractProviderStatusText(payload);
    const normalized = statusText.toLowerCase();
    const responseCode = this.extractResponseCode(payload);

    if (
      normalized.includes('paid') ||
      normalized.includes('completed') ||
      normalized.includes('success')
    ) {
      return 'paid';
    }

    if (
      normalized.includes('cancel') ||
      normalized.includes('failed') ||
      normalized.includes('error') ||
      normalized.includes('rejected') ||
      normalized.includes('refused') ||
      normalized.includes('expired')
    ) {
      return 'failed';
    }

    if (responseCode && responseCode !== '00' && responseCode !== '0') {
      return 'failed';
    }

    return 'pending';
  }

  private extractProviderStatusText(payload: Record<string, unknown>): string {
    const candidates = [
      this.readString(payload.response_text),
      this.readString(payload.status),
      this.readNestedString(payload, ['invoice', 'status']),
      this.readNestedString(payload, ['data', 'status']),
      this.readNestedString(payload, ['data', 'response_text']),
      this.readNestedString(payload, ['transaction', 'status']),
    ]
      .filter(Boolean)
      .join(' | ')
      .trim();

    return candidates || 'pending';
  }

  private extractResponseCode(payload: Record<string, unknown>): string {
    const value =
      this.readString(payload.response_code) ||
      this.readNestedString(payload, ['data', 'response_code']) ||
      this.readNestedString(payload, ['invoice', 'response_code']);
    return value.trim();
  }

  private extractCheckoutToken(payload: unknown): string | null {
    if (!payload || typeof payload !== 'object') return null;
    const candidate = payload as PaydunyaCheckoutResponse;

    const token =
      this.readString(candidate.token) ||
      this.readString(candidate.invoice?.token);

    return token || null;
  }

  private extractCheckoutInvoiceUrl(payload: unknown): string | null {
    if (!payload || typeof payload !== 'object') return null;
    const candidate = payload as PaydunyaCheckoutResponse;

    const url =
      this.readString(candidate.invoice_url) ||
      this.readString(candidate.redirect_url) ||
      this.readString(candidate.invoice?.url);

    return url || null;
  }

  private extractTokenFromIpnPayload(payload: unknown): string | null {
    if (!payload) {
      return null;
    }

    const objectPayload =
      typeof payload === 'string' ? this.safeJsonParse(payload) : payload;

    if (!objectPayload || typeof objectPayload !== 'object') {
      return null;
    }

    return (
      this.readNestedString(objectPayload, ['token']) ||
      this.readNestedString(objectPayload, ['invoice_token']) ||
      this.readNestedString(objectPayload, ['data', 'token']) ||
      this.readNestedString(objectPayload, ['data', 'invoice', 'token']) ||
      this.readNestedString(objectPayload, ['data', 'invoice_token']) ||
      this.readNestedString(objectPayload, ['invoice', 'token']) ||
      null
    );
  }

  private safeJsonParse(value: string): unknown {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  private asRecord(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }
    return value as Record<string, unknown>;
  }

  private readNestedString(source: unknown, path: string[]): string {
    let cursor: unknown = source;
    for (const key of path) {
      if (!cursor || typeof cursor !== 'object') {
        return '';
      }
      cursor = (cursor as Record<string, unknown>)[key];
    }
    return this.readString(cursor);
  }

  private readString(value: unknown): string {
    if (typeof value === 'string') {
      return value.trim();
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
    return '';
  }

  private providerErrorText(payload: unknown): string {
    if (!payload || typeof payload !== 'object') {
      return 'Erreur inconnue.';
    }

    const data = payload as Record<string, unknown>;
    return (
      this.readString(data.response_text) ||
      this.readString(data.status) ||
      this.readString(data.message) ||
      'Erreur inconnue.'
    );
  }

  private requireEnv(name: string): string {
    const value = this.configService.get<string>(name)?.trim() || '';
    if (!value) {
      throw new BadRequestException(
        `${name} manquant. Configurez les cles PayDunya dans le backend.`,
      );
    }
    return value;
  }
}
