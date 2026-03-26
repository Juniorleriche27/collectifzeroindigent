import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { MEMBER_PHOTO_BUCKET, isStoragePhotoPath } from "@/lib/supabase/member-photo";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { data: member, error: memberError } = await supabase
    .from("member")
    .select("photo_url")
    .eq("user_id", user.id)
    .maybeSingle();

  if (memberError || !member?.photo_url) {
    return NextResponse.json({ error: "Photo non trouvée" }, { status: 404 });
  }

  if (!isStoragePhotoPath(member.photo_url)) {
    // Already a full URL — fetch externally
    try {
      const res = await fetch(member.photo_url);
      if (!res.ok) throw new Error("Fetch failed");
      const buffer = await res.arrayBuffer();
      const contentType = res.headers.get("content-type") || "image/jpeg";
      const base64 = Buffer.from(buffer).toString("base64");
      return NextResponse.json({ base64: `data:${contentType};base64,${base64}` });
    } catch {
      return NextResponse.json({ error: "Impossible de charger la photo" }, { status: 500 });
    }
  }

  const { data: fileData, error: downloadError } = await supabase.storage
    .from(MEMBER_PHOTO_BUCKET)
    .download(member.photo_url);

  if (downloadError || !fileData) {
    return NextResponse.json({ error: "Impossible de télécharger la photo" }, { status: 500 });
  }

  const arrayBuffer = await fileData.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const mimeType = fileData.type || "image/jpeg";

  return NextResponse.json({ base64: `data:${mimeType};base64,${base64}` });
}
