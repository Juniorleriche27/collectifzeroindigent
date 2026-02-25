"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, Plus, SendHorizontal } from "lucide-react";

import { CardDescription } from "@/components/ui/card";
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

type ChatMessage = {
  content: string;
  createdAt: string;
  id: string;
  pending?: boolean;
  role: "assistant" | "user";
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

function normalizedParagraph(value: string): string {
  return value
    .replace(/\r/g, "")
    .replace(/^\s*[-+\u2022]\s+/gm, " ")
    .replace(/^\s*\d+[.)-]\s+/gm, " ")
    .replace(/[*_`#>-]/g, " ")
    .replace(/\s*\n+\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString("fr-FR");
}

function sortedHistory(items: SupportAiHistoryItem[]) {
  return [...items].sort(
    (first, second) => new Date(second.created_at).getTime() - new Date(first.created_at).getTime(),
  );
}

function toArchiveMessages(item: SupportAiHistoryItem): ChatMessage[] {
  return [
    {
      content: normalizedParagraph(item.question),
      createdAt: item.created_at,
      id: `${item.id}:q`,
      role: "user",
    },
    {
      content: normalizedParagraph(item.answer),
      createdAt: item.created_at,
      id: `${item.id}:a`,
      role: "assistant",
    },
  ];
}

function toShortTitle(value: string): string {
  const text = normalizedParagraph(value);
  if (text.length <= 44) return text;
  return `${text.slice(0, 41)}...`;
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
  const [activeArchiveId, setActiveArchiveId] = useState<string | null>(
    initialHistory[0]?.id ?? null,
  );
  const [draftMessages, setDraftMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(loadError);
  const [remainingToday, setRemainingToday] = useState(initialRemainingToday);
  const [usedToday, setUsedToday] = useState(initialUsedToday);
  const [dailyLimit, setDailyLimit] = useState(initialDailyLimit);
  const [disclaimer, setDisclaimer] = useState(initialDisclaimer);
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeArchive = useMemo(
    () => history.find((item) => item.id === activeArchiveId) ?? null,
    [history, activeArchiveId],
  );

  const messages = useMemo(() => {
    if (activeArchive) {
      return toArchiveMessages(activeArchive);
    }
    return draftMessages;
  }, [activeArchive, draftMessages]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, activeArchiveId]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        clearInterval(typingTimerRef.current);
      }
    };
  }, []);

  function startNewDiscussion() {
    setActiveArchiveId(null);
    setDraftMessages([]);
    setQuestion("");
    setError(null);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }

  async function submitQuestion() {
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

    let workingDraft = draftMessages;
    if (activeArchive) {
      workingDraft = toArchiveMessages(activeArchive);
      setDraftMessages(workingDraft);
      setActiveArchiveId(null);
    }

    const nowIso = new Date().toISOString();
    const userMessage: ChatMessage = {
      content: normalizedQuestion,
      createdAt: nowIso,
      id: `user-${Date.now()}`,
      role: "user",
    };
    const pendingAssistantId = `assistant-pending-${Date.now()}`;
    const pendingAssistantMessage: ChatMessage = {
      content: "",
      createdAt: nowIso,
      id: pendingAssistantId,
      pending: true,
      role: "assistant",
    };

    const nextDraft = [...workingDraft, userMessage, pendingAssistantMessage];
    setDraftMessages(nextDraft);
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

      const cleanAnswer = normalizedParagraph(payload.item.answer);
      setDailyLimit(payload.daily_limit);
      setDisclaimer(payload.disclaimer);
      setRemainingToday(payload.remaining_today);
      setUsedToday(payload.used_today);

      setHistory((previous) => {
        const withoutSame = previous.filter((item) => item.id !== payload.item.id);
        return [payload.item, ...withoutSame];
      });

      setTypingMessageId(pendingAssistantId);
      if (typingTimerRef.current) {
        clearInterval(typingTimerRef.current);
      }

      let cursor = 0;
      typingTimerRef.current = setInterval(() => {
        cursor += 2;
        const step = cleanAnswer.slice(0, cursor);
        setDraftMessages((previous) =>
          previous.map((entry) =>
            entry.id === pendingAssistantId
              ? {
                  ...entry,
                  content: step,
                  pending: cursor < cleanAnswer.length,
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
      setDraftMessages((previous) => previous.filter((entry) => entry.id !== pendingAssistantId));
      setQuestion(normalizedQuestion);
      setError(toErrorMessage(caughtError, "Erreur support IA."));
      setTypingMessageId(null);
    } finally {
      setSending(false);
    }
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitQuestion();
  }

  function onTextareaKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!sending) {
        void submitQuestion();
      }
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">Support</p>
        <h2 className="mt-1 text-3xl font-semibold tracking-tight">Support CZI</h2>
        <CardDescription className="mt-1">
          Discussion fluide. Reponses courtes et precises.
        </CardDescription>
      </div>

      <div className="grid h-[calc(100vh-9.5rem)] min-h-[620px] grid-cols-1 gap-3 lg:grid-cols-[320px,minmax(0,1fr)]">
        <aside className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface/95 shadow-soft">
          <div className="border-b border-border p-3">
            <button
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-3 py-2 text-sm font-semibold text-white transition hover:bg-foreground/90"
              onClick={startNewDiscussion}
              type="button"
            >
              <Plus size={16} />
              Nouvelle discussion
            </button>
            <p className="mt-2 text-xs text-muted">
              {usedToday}/{dailyLimit} utilisees, {remainingToday} restantes.
            </p>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {history.length === 0 ? (
              <p className="rounded-lg bg-muted-surface/60 p-3 text-sm text-muted">
                Aucune discussion archivee.
              </p>
            ) : (
              history.map((entry) => {
                const active = activeArchiveId === entry.id;
                return (
                  <button
                    className={`w-full rounded-xl border px-3 py-2 text-left transition-colors ${
                      active
                        ? "border-foreground/25 bg-foreground/10 text-foreground"
                        : "border-border bg-surface text-muted hover:bg-muted-surface/80 hover:text-foreground"
                    }`}
                    key={entry.id}
                    onClick={() => setActiveArchiveId(entry.id)}
                    type="button"
                  >
                    <p className="text-[11px] text-muted">{formatDate(entry.created_at)}</p>
                    <p className="mt-1 text-sm font-medium">{toShortTitle(entry.question)}</p>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface/95 shadow-soft">
          <div className="border-b border-border px-4 py-3">
            <p className="text-xs text-muted">{disclaimer}</p>
          </div>

          <div
            className="flex-1 space-y-5 overflow-y-auto bg-[linear-gradient(180deg,rgba(224,234,243,0.35),rgba(247,251,255,0.82))] px-5 py-5"
            ref={listRef}
          >
            {messages.length === 0 ? (
              <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-dashed border-border bg-surface/75 p-6 text-center text-sm text-muted">
                Dites-moi ce que vous voulez faire dans CZI, je vous guide.
              </div>
            ) : (
              messages.map((message) => (
                <div
                  className={message.role === "user" ? "ml-auto max-w-[86%]" : "mr-auto max-w-[90%]"}
                  key={message.id}
                >
                  <div
                    className={
                      message.role === "user"
                        ? "rounded-2xl rounded-br-sm bg-foreground px-4 py-3 text-sm text-white"
                        : "rounded-2xl rounded-bl-sm border border-border bg-surface px-4 py-3 text-sm leading-relaxed text-foreground"
                    }
                  >
                    {message.content || (message.pending ? "Generation..." : "")}
                    {typingMessageId === message.id ? <span className="ml-1 animate-pulse">|</span> : null}
                  </div>
                </div>
              ))
            )}
          </div>

          <form className="shrink-0 border-t border-border bg-surface/95 p-4" onSubmit={onSubmit}>
            <div className="mx-auto w-full max-w-4xl">
              <div className="relative">
                <textarea
                  className="h-28 w-full resize-none rounded-2xl border border-border bg-surface px-4 py-3 pr-14 text-sm text-foreground outline-none transition-colors focus:border-foreground/40 focus:ring-4 focus:ring-foreground/10"
                  name="question"
                  onChange={(event) => setQuestion(event.target.value)}
                  onKeyDown={onTextareaKeyDown}
                  placeholder="Posez votre question..."
                  ref={textareaRef}
                  required
                  value={question}
                />
                <button
                  aria-label="Envoyer"
                  className="absolute bottom-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black text-white transition hover:bg-black/90 disabled:cursor-not-allowed disabled:bg-black/40"
                  disabled={sending || remainingToday <= 0}
                  type="submit"
                >
                  <SendHorizontal size={16} />
                </button>
                <div className="pointer-events-none absolute left-3 top-3 text-muted">
                  <MessageCircle size={15} />
                </div>
              </div>
              <div className="mt-2 min-h-5 text-sm">
                {error ? <p className="text-red-600">{error}</p> : null}
              </div>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
