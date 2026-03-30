import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

function backendApiBaseUrl(): string {
  const raw = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:4000";
  const base = raw.endsWith("/") ? raw.slice(0, -1) : raw;
  return base.endsWith("/api") ? base : `${base}/api`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return NextResponse.json({ items: [] });
  }

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return NextResponse.json({ items: [] }, { status: 401 });
  }

  const query = new URLSearchParams({ page_size: "8", q });
  const res = await fetch(`${backendApiBaseUrl()}/members?${query.toString()}`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    return NextResponse.json({ items: [] });
  }

  const data = (await res.json().catch(() => null)) as {
    rows?: Array<{
      email: string | null;
      first_name: string | null;
      id: string;
      last_name: string | null;
      status: string | null;
    }>;
  } | null;

  const items = (data?.rows ?? []).map((m) => ({
    email: m.email,
    id: m.id,
    name: [m.first_name, m.last_name].filter(Boolean).join(" ") || "—",
    status: m.status,
  }));

  return NextResponse.json({ items });
}
