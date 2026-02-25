"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, SendHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import type { SupportAiHistoryItem } from "@/lib/backend/api";

type SupportClientProps = {
  dailyLimit: number;
  disclaimer: string;
  items: SupportAiHistoryItem[];
  loadError: string | null;
  remainingToday: number;
  usedToday: number;
};

type AskSupportAiResponse = {
  daily_limit: number;
  disclaimer: string;
  item: SupportAiHistoryItem;
  remaining_today: number;
  used_today: number;
};

function isAskSupportAiResponse(payload: unknown): payload is AskSupportAiResponse {
  if (!payload || typeof payload !== "object") return false;
  const candidate = payload as Partial<AskSupportAiResponse>;
  return (
    typeof candidate.daily_limit === "number" &&
    typeof candidate.remaining_today === "number" &&
    typeof candidate.used_today === "number" &&
    typeof candidate.disclaimer === "string" &&
    !!candidate.item &&
    typeof candidate.item === "object"
  );
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

function normalizedParagraph(value: string): string {
  return value
    .replace(/\r/g, "")
    .replace(/^\s*[-+•]\s+/gm, " ")
    .replace(/^\s*\d+[.)-]\s+/gm, " ")
    .replace(/[*_`#>-]/g, " ")
    .replace(/\s*\n+\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function sortedHistory(items: SupportAiHistoryItem[]): SupportAiHistoryItem[] {
  return [...items].sort(
    (first, second) =>
      new Date(first.created_at).getTime() - new Date(second.created_at).getTime(),
  );
}

function shortQuestion(question: string): string {
  const trimmed = question.trim();
  if (trimmed.length <= 58) return trimmed;
  return `${trimmed.slice(0, 55)}...`;
}

function displayDate(dateIso: string): string {
  return new Date(dateIso).toLocaleString("fr-FR");
}

export function SupportClient({
  dailyLimit: initialDailyLimit,
  disclaimer: initialDisclaimer,
  items,
  loadError,
  remainingToday: initialRemainingToday,
  usedToday: initialUsedToday,
}: SupportClientProps) {
  const initialHistory = useMemo(() => sortedHistory(items), [items]);
  const [history, setHistory] = useState<SupportAiHistoryItem[]>(initialHistory);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialHistory[initialHistory.length - 1]?.id ?? null,
  );
  const [question, setQuestion] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(loadError);
  const [info, setInfo] = useState<string | null>(null);
  const [remainingToday, setRemainingToday] = useState(initialRemainingToday);
  const [usedToday, setUsedToday] = useState(initialUsedToday);
  const [dailyLimit, setDailyLimit] = useState(initialDailyLimit);
  const [disclaimer, setDisclaimer] = useState(initialDisclaimer);
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [history, selectedId]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        clearInterval(typingTimerRef.current);
      }
    };
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedQuestion = question.trim();
    if (!normalizedQuestion) {
      setError("Saisissez une question.");
      return;
    }

    if (remainingToday <= 0) {
      setError("Limite quotidienne atteinte pour aujourd'hui.");
      return;
    }

    setSending(true);
    setError(null);
    setInfo(null);
    const previousLastId = history[history.length - 1]?.id ?? null;

    const optimisticId = `tmp-${Date.now()}`;
    const optimisticEntry: SupportAiHistoryItem = {
      answer: "",
      created_at: new Date().toISOString(),
      id: optimisticId,
      model: null,
      provider: "support",
      question: normalizedQuestion,
    };

    setHistory((previous) => [...previous, optimisticEntry]);
    setSelectedId(optimisticId);
    setQuestion("");

    try {
      const response = await fetch("/api/support-ai/ask", {
        body: JSON.stringify({ question: normalizedQuestion }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      const payload = (await response.json().catch(() => null)) as
        | AskSupportAiResponse
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(
          payload && "error" in payload && typeof payload.error === "string"
            ? payload.error
            : "Impossible de contacter le support CZI.",
        );
      }

      if (!isAskSupportAiResponse(payload)) {
        throw new Error("Reponse support invalide.");
      }
      const item = payload.item;

      const cleanAnswer = normalizedParagraph(item.answer);
      setHistory((previous) =>
        previous.map((entry) =>
          entry.id === optimisticId
            ? {
                ...item,
                answer: "",
              }
            : entry,
        ),
      );

      setSelectedId(item.id);
      setDailyLimit(payload.daily_limit);
      setDisclaimer(payload.disclaimer);
      setRemainingToday(payload.remaining_today);
      setUsedToday(payload.used_today);
      setTypingMessageId(item.id);
      setInfo("Reponse recue.");

      if (typingTimerRef.current) {
        clearInterval(typingTimerRef.current);
      }

      let cursor = 0;
      typingTimerRef.current = setInterval(() => {
        cursor += 2;
        const nextAnswer = cleanAnswer.slice(0, cursor);

        setHistory((previous) =>
          previous.map((entry) =>
            entry.id === item.id
              ? {
                  ...entry,
                  answer: nextAnswer,
                }
              : entry,
          ),
        );

        if (cursor >= cleanAnswer.length) {
          if (typingTimerRef.current) {
            clearInterval(typingTimerRef.current);
          }
          typingTimerRef.current = null;
          setTypingMessageId(null);
        }
      }, 14);
    } catch (caughtError) {
      setHistory((previous) => previous.filter((entry) => entry.id !== optimisticId));
      setSelectedId(previousLastId);
      setQuestion(normalizedQuestion);
      setError(toErrorMessage(caughtError, "Erreur support IA."));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">Support</p>
        <h2 className="mt-1 text-3xl font-semibold tracking-tight">Support CZI</h2>
        <CardDescription className="mt-2">
          Posez votre question. Reponses courtes, claires et orientees action.
        </CardDescription>
      </div>

      <div className="grid h-[calc(100vh-13.5rem)] min-h-[540px] grid-cols-1 gap-4 xl:grid-cols-[320px,1fr]">
        <aside className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface/95 shadow-soft">
          <div className="border-b border-border bg-muted-surface/70 p-4">
            <CardTitle className="text-base">Historique</CardTitle>
            <CardDescription className="mt-1">
              {usedToday}/{dailyLimit} utilisees, {remainingToday} restantes.
            </CardDescription>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {history.length === 0 ? (
              <p className="rounded-lg bg-muted-surface/60 p-3 text-sm text-muted">
                Aucune question pour le moment.
              </p>
            ) : (
              history.map((entry) => {
                const active = selectedId === entry.id;
                return (
                  <button
                    className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                      active
                        ? "border-primary/40 bg-primary/10 text-foreground"
                        : "border-border bg-surface/80 text-muted hover:bg-muted-surface/80 hover:text-foreground"
                    }`}
                    key={entry.id}
                    onClick={() => setSelectedId(entry.id)}
                    type="button"
                  >
                    <p className="text-xs text-muted">{displayDate(entry.created_at)}</p>
                    <p className="mt-1 text-sm font-medium">{shortQuestion(entry.question)}</p>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface/95 shadow-soft">
          <div className="border-b border-border bg-muted-surface/70 px-5 py-4">
            <p className="text-sm font-semibold text-foreground">Panneau de reponse</p>
            <p className="mt-1 text-xs text-muted">{disclaimer}</p>
          </div>

          <div
            className="flex-1 space-y-4 overflow-y-auto bg-[linear-gradient(180deg,rgba(224,234,243,0.45),rgba(247,251,255,0.75))] px-5 py-5"
            ref={listRef}
          >
            {history.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-surface/70 p-6 text-sm text-muted">
                Posez une question pour demarrer le support.
              </div>
            ) : (
              history.map((entry) => {
                const answerText = normalizedParagraph(entry.answer);
                return (
                  <div className="space-y-2" key={entry.id}>
                    <div className="ml-auto max-w-[88%] rounded-2xl rounded-br-sm bg-primary px-4 py-3 text-sm text-primary-foreground">
                      {entry.question}
                    </div>
                    <div className="max-w-[92%] rounded-2xl rounded-bl-sm border border-border bg-surface px-4 py-3 text-sm leading-relaxed text-foreground">
                      {answerText || (typingMessageId === entry.id ? "Generation..." : "Reponse vide.")}
                      {typingMessageId === entry.id ? <span className="ml-1 animate-pulse">|</span> : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form className="border-t border-border bg-surface/95 p-4" onSubmit={onSubmit}>
            <div className="flex items-start gap-3">
              <div className="mt-2 rounded-full bg-primary/15 p-2 text-primary">
                <MessageCircle size={16} />
              </div>
              <div className="flex-1">
                <textarea
                  className="h-24 w-full resize-none rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/20"
                  name="question"
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="Posez votre question..."
                  required
                  value={question}
                />
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="min-h-5 text-sm">
                    {error ? <p className="text-red-600">{error}</p> : null}
                    {!error && info ? <p className="text-emerald-700">{info}</p> : null}
                  </div>
                  <Button className="gap-2" disabled={sending || remainingToday <= 0} type="submit">
                    <SendHorizontal size={16} />
                    {sending ? "Envoi..." : "Envoyer"}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
