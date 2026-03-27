"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, MessageCircle, SendHorizontal, X } from "lucide-react";

type Msg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
};

function clean(text: string): string {
  return text
    .replace(/\r/g, "")
    .replace(/[*_`#>-]/g, " ")
    .replace(/\s*\n+\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [q, setQ] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [msgs]);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  async function send() {
    const question = q.trim();
    if (!question || sending) return;
    setSending(true);
    setQ("");

    const uid = `u-${Date.now()}`;
    const aid = `a-${Date.now()}`;
    setMsgs((prev) => [
      ...prev,
      { id: uid, role: "user", content: question },
      { id: aid, role: "assistant", content: "", pending: true },
    ]);

    try {
      const res = await fetch("/api/support-ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      const data = (await res.json().catch(() => null)) as { item?: { answer?: string } } | null;
      const answer = clean(data?.item?.answer ?? "Je n'ai pas pu répondre à cette question.");
      setMsgs((prev) =>
        prev.map((m) => (m.id === aid ? { ...m, content: answer, pending: false } : m)),
      );
    } catch {
      setMsgs((prev) =>
        prev.map((m) =>
          m.id === aid
            ? { ...m, content: "Erreur de connexion. Réessayez.", pending: false }
            : m,
        ),
      );
    } finally {
      setSending(false);
    }
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  return (
    <>
      {/* ── Chat panel ────────────────────────────── */}
      <div
        className="fixed right-4 z-[9000] flex w-[calc(100vw-2rem)] max-w-[340px] flex-col overflow-hidden rounded-2xl bg-white sm:right-6"
        style={{
          bottom: "5.5rem",
          height: open ? 440 : 0,
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "height .28s cubic-bezier(.4,0,.2,1), opacity .22s ease",
          border: "1px solid #E2E9F4",
          boxShadow: "0 20px 60px rgba(13,37,80,.18)",
        }}
      >
        {/* Header */}
        <div
          className="flex shrink-0 items-center justify-between px-4 py-3"
          style={{ background: "linear-gradient(120deg, #0F5F6B 0%, #1A8A9B 100%)" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full"
              style={{ background: "rgba(255,255,255,.18)" }}
            >
              <Bot size={16} className="text-white" />
            </div>
            <div>
              <p
                className="text-[0.58rem] font-bold uppercase tracking-[.12em] text-white/55"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                Support CZI
              </p>
              <p
                className="text-[0.8rem] font-bold text-white"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                Conseiller CZI
              </p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/15 hover:text-white"
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 space-y-3 overflow-y-auto p-4"
          style={{ background: "#F8FAFC" }}
        >
          {msgs.length === 0 && (
            <div
              className="rounded-xl p-3 text-[0.8rem] leading-relaxed"
              style={{
                background: "#fff",
                border: "1px solid #E2E9F4",
                color: "#546180",
              }}
            >
              Bonjour ! Je suis l&apos;assistant CZI. Posez-moi une question sur l&apos;organisation, les projets ou les ODD.
            </div>
          )}
          {msgs.map((m) => (
            <div key={m.id} className={m.role === "user" ? "flex justify-end" : ""}>
              <div
                className="max-w-[88%] rounded-2xl px-3 py-2 text-[0.8rem] leading-relaxed"
                style={
                  m.role === "user"
                    ? { background: "#0F5F6B", color: "#fff", borderRadius: "14px 14px 4px 14px" }
                    : { background: "#fff", border: "1px solid #E2E9F4", color: "#12202E", borderRadius: "14px 14px 14px 4px" }
                }
              >
                {m.pending ? <span className="animate-pulse opacity-60">…</span> : m.content}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div
          className="shrink-0 border-t p-3"
          style={{ background: "#fff", borderColor: "#E2E9F4" }}
        >
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={onKey}
              placeholder="Posez votre question…"
              rows={2}
              disabled={sending}
              className="flex-1 resize-none rounded-xl px-3 py-2 text-[0.8rem] outline-none transition-colors disabled:opacity-50"
              style={{
                background: "#F8FAFC",
                border: "1px solid #E2E9F4",
                color: "#12202E",
                lineHeight: 1.5,
              }}
            />
            <button
              onClick={() => void send()}
              disabled={sending || !q.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white transition-colors disabled:opacity-40"
              style={{ background: "#0F5F6B" }}
              aria-label="Envoyer"
            >
              <SendHorizontal size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Floating trigger button ──────────────── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed right-4 z-[9000] flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 sm:right-6"
        style={{
          bottom: "1.25rem",
          background: "linear-gradient(135deg, #1A8A9B 0%, #0F5F6B 100%)",
          boxShadow: "0 8px 32px rgba(15,95,107,.4)",
        }}
        aria-label={open ? "Fermer le conseiller" : "Ouvrir le conseiller CZI"}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </>
  );
}
