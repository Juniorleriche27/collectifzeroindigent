import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  getCurrentMemberId,
  requireUserId,
} from '../common/supabase-auth-context';
import type { Database } from '../infra/database.types';
import { SupabaseDataService } from '../infra/supabase-data.service';
import { AskSupportAiDto } from './dto/ask-support-ai.dto';

type SupportHistoryRow = Database['public']['Tables']['support_ai_chat']['Row'];

const SUPPORT_DISCLAIMER =
  'Assistant IA informatif uniquement: ne remplace pas un avis juridique, medical ou financier professionnel.';

@Injectable()
export class SupportAiService {
  constructor(
    private readonly supabaseDataService: SupabaseDataService,
    private readonly configService: ConfigService,
  ) {}

  async history(accessToken: string, requestedLimit?: number) {
    const client = this.supabaseDataService.forUser(accessToken);
    const userId = await requireUserId(client);

    const limit = Math.min(
      Math.max(
        requestedLimit ??
          this.readPositiveIntEnv('SUPPORT_AI_HISTORY_LIMIT', 30),
        1,
      ),
      100,
    );
    const items = await this.loadHistory(client, userId, limit);
    const usageToday = await this.countRequestsToday(client, userId);
    const dailyLimit = this.readPositiveIntEnv('SUPPORT_AI_DAILY_LIMIT', 20);

    return {
      daily_limit: dailyLimit,
      disclaimer: SUPPORT_DISCLAIMER,
      items,
      remaining_today: Math.max(0, dailyLimit - usageToday),
      used_today: usageToday,
    };
  }

  async ask(accessToken: string, payload: AskSupportAiDto) {
    const client = this.supabaseDataService.forUser(accessToken);
    const userId = await requireUserId(client);
    const memberId = await getCurrentMemberId(client, userId);

    const question = payload.question.trim();
    if (!question) {
      throw new BadRequestException('Question vide.');
    }

    const maxQuestionChars = this.readPositiveIntEnv(
      'SUPPORT_AI_MAX_QUESTION_CHARS',
      1200,
    );
    if (question.length > maxQuestionChars) {
      throw new BadRequestException(
        `Question trop longue. Maximum ${maxQuestionChars} caracteres.`,
      );
    }

    const dailyLimit = this.readPositiveIntEnv('SUPPORT_AI_DAILY_LIMIT', 20);
    const usageToday = await this.countRequestsToday(client, userId);
    if (usageToday >= dailyLimit) {
      throw new BadRequestException(
        `Limite quotidienne atteinte (${dailyLimit} questions/jour).`,
      );
    }

    const model =
      this.configService.get<string>('COHERE_MODEL')?.trim() ||
      'command-r-plus';
    const historyTurns = this.readPositiveIntEnv('SUPPORT_AI_CONTEXT_TURNS', 6);
    const historyRows = await this.loadHistory(client, userId, historyTurns);

    const answer = await this.requestCohere({
      historyRows: historyRows.slice().reverse(),
      model,
      question,
    });

    const { data: inserted, error: insertError } = await client
      .from('support_ai_chat')
      .insert({
        answer,
        member_id: memberId ?? null,
        model,
        provider: 'cohere',
        question,
        user_id: userId,
      })
      .select('id, question, answer, provider, model, created_at')
      .single();

    if (insertError || !inserted) {
      throw (
        insertError ??
        new BadRequestException(
          "Impossible d'enregistrer l'historique Support IA.",
        )
      );
    }

    const updatedUsage = usageToday + 1;
    return {
      daily_limit: dailyLimit,
      disclaimer: SUPPORT_DISCLAIMER,
      item: inserted as Pick<
        SupportHistoryRow,
        'answer' | 'created_at' | 'id' | 'model' | 'provider' | 'question'
      >,
      remaining_today: Math.max(0, dailyLimit - updatedUsage),
      used_today: updatedUsage,
    };
  }

  private async loadHistory(
    client: ReturnType<SupabaseDataService['forUser']>,
    userId: string,
    limit: number,
  ) {
    const { data, error } = await client
      .from('support_ai_chat')
      .select('id, question, answer, provider, model, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return (data ?? []) as Array<
      Pick<
        SupportHistoryRow,
        'answer' | 'created_at' | 'id' | 'model' | 'provider' | 'question'
      >
    >;
  }

  private async countRequestsToday(
    client: ReturnType<SupabaseDataService['forUser']>,
    userId: string,
  ): Promise<number> {
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);

    const { count, error } = await client
      .from('support_ai_chat')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', dayStart.toISOString());

    if (error) {
      throw error;
    }

    return count ?? 0;
  }

  private async requestCohere(args: {
    historyRows: Array<
      Pick<
        SupportHistoryRow,
        'answer' | 'created_at' | 'id' | 'model' | 'provider' | 'question'
      >
    >;
    model: string;
    question: string;
  }): Promise<string> {
    const apiKey = this.configService.get<string>('COHERE_API_KEY')?.trim();
    if (!apiKey) {
      throw new BadRequestException(
        'COHERE_API_KEY manquant. Configurez la cle API Cohere dans le backend.',
      );
    }

    const chatHistory = args.historyRows.flatMap((row) => [
      { message: row.question, role: 'USER' as const },
      { message: row.answer, role: 'CHATBOT' as const },
    ]);

    const response = await fetch('https://api.cohere.ai/v1/chat', {
      body: JSON.stringify({
        chat_history: chatHistory,
        max_tokens: this.readPositiveIntEnv('SUPPORT_AI_MAX_TOKENS', 450),
        message: args.question,
        model: args.model,
        preamble: this.supportSystemPrompt(),
        temperature: 0.2,
      }),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    const rawBody = await response.text();
    if (!response.ok) {
      throw new BadRequestException(
        this.extractCohereError(rawBody, response.status) ||
          'Erreur Cohere. Reessayez dans quelques instants.',
      );
    }

    let parsed: unknown = null;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      parsed = null;
    }

    const answer = this.extractCohereAnswer(parsed).trim();
    if (!answer) {
      throw new BadRequestException(
        'Reponse vide du support IA. Reessayez avec une question plus precise.',
      );
    }

    return this.normalizeAnswerText(answer);
  }

  private extractCohereAnswer(payload: unknown): string {
    if (!payload || typeof payload !== 'object') {
      return '';
    }

    const candidate = payload as {
      message?: unknown;
      text?: unknown;
    };

    if (typeof candidate.text === 'string') {
      return candidate.text;
    }

    if (candidate.message && typeof candidate.message === 'object') {
      const content = (candidate.message as { content?: unknown }).content;
      if (Array.isArray(content)) {
        const textParts = content
          .map((part) => {
            if (!(typeof part === 'object' && part && 'text' in part)) {
              return '';
            }
            const rawText = (part as { text?: unknown }).text;
            return typeof rawText === 'string' ? rawText : '';
          })
          .filter(Boolean);
        if (textParts.length > 0) {
          return textParts.join('\n');
        }
      }
    }

    return '';
  }

  private extractCohereError(rawBody: string, status: number): string {
    if (!rawBody) {
      return `Cohere: HTTP ${status}`;
    }

    try {
      const parsed = JSON.parse(rawBody) as { message?: unknown };
      if (typeof parsed.message === 'string' && parsed.message.trim()) {
        return parsed.message.trim();
      }
    } catch {
      // Ignore parse error.
    }

    return rawBody.slice(0, 260);
  }

  private supportSystemPrompt(): string {
    return [
      'Tu es l assistant support de la plateforme CZI.',
      'Objectif: aider les membres a utiliser la plateforme (onboarding, membres, communaute, communiques, campagnes email, roles).',
      'Contexte institutionnel CZI: CZI est un reseau de jeunes engages; ce n est pas une plateforme lancee en 2019.',
      'CZI est constitue officiellement le 17 avril 2020 par 15 associations/ONG de jeunesse.',
      'Vision: contribuer a l atteinte des ODD par la synergie des actions des jeunes, avec priorite a l ODD 1.',
      'Mission: orientation, formation, insertion professionnelle, entrepreneuriat et engagement citoyen des jeunes.',
      'Format obligatoire de sortie: un seul paragraphe, 3 a 5 phrases, maximum 90 mots.',
      'Interdictions de forme: pas de markdown, pas de titres, pas de liste, pas de numerotation, pas de symbole **.',
      'Style attendu: francais simple, precis, direct, actionnable.',
      'Si une information manque, le dire clairement sans inventer.',
    ].join('\n');
  }

  private normalizeAnswerText(rawAnswer: string): string {
    const withoutMarkdown = rawAnswer
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/[*_`#>]/g, ' ')
      .replace(/^\s*[-+•]\s+/gm, ' ')
      .replace(/^\s*\d+[.)-]\s+/gm, ' ')
      .replace(/\s*\n+\s*/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    if (!withoutMarkdown) {
      return '';
    }

    if (withoutMarkdown.length <= 900) {
      return withoutMarkdown;
    }

    return `${withoutMarkdown.slice(0, 900).trim()}...`;
  }

  private readPositiveIntEnv(name: string, fallback: number): number {
    const raw = this.configService.get<string>(name)?.trim() ?? '';
    if (!raw) {
      return fallback;
    }
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return fallback;
    }
    return parsed;
  }
}
