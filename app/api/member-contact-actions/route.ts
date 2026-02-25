import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type ContactChannel = "email" | "phone";

type ContactActionPayload = {
  channel?: string;
  member_id?: string;
  source?: string;
};

function backendApiBaseUrl(): string {
  const rawBaseUrl =
    process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:4000";

  const baseUrl = rawBaseUrl.endsWith("/") ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
  return baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`;
}

function normalizeChannel(value: string | undefined): ContactChannel | null {
  if (value === "email" || value === "phone") {
    return value;
  }
  return null;
}

export async function POST(request: Request) {
  let payload: ContactActionPayload = {};
  try {
    payload = (await request.json()) as ContactActionPayload;
  } catch {
    return NextResponse.json({ error: "Payload invalide." }, { status: 400 });
  }

  const memberId = String(payload.member_id ?? "").trim();
  const channel = normalizeChannel(payload.channel);
  const source = String(payload.source ?? "unknown").trim() || "unknown";

  if (!memberId || !channel) {
    return NextResponse.json({ error: "member_id et channel sont obligatoires." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    return NextResponse.json({ error: "Session invalide." }, { status: 401 });
  }

  const response = await fetch(`${backendApiBaseUrl()}/members/contact-actions`, {
    body: JSON.stringify({
      channel,
      member_id: memberId,
      source,
    }),
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  const raw = await response.text();
  let parsed: unknown = null;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    parsed = raw || null;
  }

  if (!response.ok) {
    return NextResponse.json(
      {
        details: parsed,
        error: "Echec enregistrement contact.",
      },
      { status: response.status },
    );
  }

  return NextResponse.json({
    logged: true,
    result: parsed,
  });
}
