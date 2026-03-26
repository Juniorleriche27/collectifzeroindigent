"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function createReportAction(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const title = (formData.get("title") as string | null)?.trim() ?? "";
  if (!title) {
    redirect("/app/rapports?error=Titre+requis");
  }

  const isPublished = formData.get("is_published") === "on";

  const payload = {
    created_by: user.id,
    description: (formData.get("description") as string | null)?.trim() || null,
    file_name: (formData.get("file_name") as string | null)?.trim() || null,
    file_size_bytes: null,
    file_url: (formData.get("file_url") as string | null)?.trim() || null,
    is_public: formData.get("is_public") === "on",
    is_published: isPublished,
    project_id: (formData.get("project_id") as string | null)?.trim() || null,
    published_at: isPublished ? new Date().toISOString() : null,
    title,
  };

  const { error } = await supabase.from("activity_report").insert(payload);

  if (error) {
    const msg = encodeURIComponent(error.message);
    redirect(`/app/rapports?error=${msg}`);
  }

  redirect("/app/rapports?notice=Rapport+enregistré+avec+succès");
}

export async function updateReportAction(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const id = (formData.get("report_id") as string | null)?.trim() ?? "";
  if (!id) {
    redirect("/app/rapports?error=ID+rapport+manquant");
  }

  const isPublished = formData.get("is_published") === "on";

  const payload: Record<string, unknown> = {
    description: (formData.get("description") as string | null)?.trim() || null,
    file_name: (formData.get("file_name") as string | null)?.trim() || null,
    file_url: (formData.get("file_url") as string | null)?.trim() || null,
    is_public: formData.get("is_public") === "on",
    is_published: isPublished,
    project_id: (formData.get("project_id") as string | null)?.trim() || null,
    title: (formData.get("title") as string | null)?.trim() || "",
  };

  if (isPublished && formData.get("set_published_at") === "on") {
    payload.published_at = new Date().toISOString();
  }

  const { error } = await supabase.from("activity_report").update(payload).eq("id", id);

  if (error) {
    const msg = encodeURIComponent(error.message);
    redirect(`/app/rapports?error=${msg}`);
  }

  redirect("/app/rapports?notice=Rapport+mis+à+jour");
}
