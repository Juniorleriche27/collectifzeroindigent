import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type AskPayload = {
  question?: string;
};

function backendApiBaseUrl(): string {
  const rawBaseUrl =
    process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:4000";

  const baseUrl = rawBaseUrl.endsWith("/") ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
  return baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`;
}

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const candidate = payload as { error?: unknown; message?: unknown };
  if (Array.isArray(candidate.message)) {
    const message = candidate.message.find((item) => typeof item === "string");
    if (typeof message === "string" && message.trim()) {
      return message.trim();
    }
  }
  if (typeof candidate.message === "string" && candidate.message.trim()) {
    return candidate.message.trim();
  }
  if (typeof candidate.error === "string" && candidate.error.trim()) {
    return candidate.error.trim();
  }

  return fallback;
}

export async function POST(request: Request) {
  let payload: AskPayload = {};
  try {
    payload = (await request.json()) as AskPayload;
  } catch {
    return NextResponse.json({ error: "Payload invalide." }, { status: 400 });
  }

  const question = String(payload.question ?? "").trim();
  if (!question) {
    return NextResponse.json({ error: "Question requise." }, { status: 400 });
  }

  // Auth is optional — public visitors can also use the chat
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  const response = await fetch(`${backendApiBaseUrl()}/support-ai/ask`, {
    body: JSON.stringify({ question }),
    headers,
    method: "POST",
  });

  const parsed = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) {
    return NextResponse.json(
      { error: extractErrorMessage(parsed, "Impossible de contacter le support CZI.") },
      { status: response.status },
    );
  }

  return NextResponse.json(parsed);
}
