import { NextResponse } from "next/server";

// Cache for 12 hours — AI messages are generated once per day
export const revalidate = 43200;

function backendApiBaseUrl(): string {
  const raw = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:4000";
  const base = raw.endsWith("/") ? raw.slice(0, -1) : raw;
  return base.endsWith("/api") ? base : `${base}/api`;
}

export type PublicBirthdayItem = {
  id: string;
  message: string;
  name: string;
  photo_url: string | null;
};

export async function GET() {
  try {
    const res = await fetch(`${backendApiBaseUrl()}/birthday/public`, {
      next: { revalidate: 43200 },
    });
    if (!res.ok) return NextResponse.json({ count: 0, items: [] });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ count: 0, items: [] });
  }
}
