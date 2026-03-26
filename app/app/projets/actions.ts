"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function createProjectAction(formData: FormData) {
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
    redirect("/app/projets?error=Titre+requis");
  }

  const payload = {
    cover_image_url: (formData.get("cover_image_url") as string | null)?.trim() || null,
    created_by: user.id,
    description: (formData.get("description") as string | null)?.trim() || null,
    end_date: (formData.get("end_date") as string | null)?.trim() || null,
    is_published: formData.get("is_published") === "on",
    location: (formData.get("location") as string | null)?.trim() || null,
    short_description: (formData.get("short_description") as string | null)?.trim() || null,
    start_date: (formData.get("start_date") as string | null)?.trim() || null,
    status: (formData.get("status") as string | null)?.trim() || "upcoming",
    title,
  };

  const { data, error } = await supabase
    .from("project")
    .insert(payload)
    .select("id")
    .single();

  if (error || !data) {
    const msg = encodeURIComponent(error?.message ?? "Impossible de créer le projet.");
    redirect(`/app/projets?error=${msg}`);
  }

  redirect(`/app/projets/${data.id}?notice=Projet+créé+avec+succès`);
}

export async function updateProjectAction(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const id = (formData.get("project_id") as string | null)?.trim() ?? "";
  if (!id) {
    redirect("/app/projets?error=ID+projet+manquant");
  }

  const payload = {
    cover_image_url: (formData.get("cover_image_url") as string | null)?.trim() || null,
    description: (formData.get("description") as string | null)?.trim() || null,
    end_date: (formData.get("end_date") as string | null)?.trim() || null,
    is_published: formData.get("is_published") === "on",
    location: (formData.get("location") as string | null)?.trim() || null,
    short_description: (formData.get("short_description") as string | null)?.trim() || null,
    start_date: (formData.get("start_date") as string | null)?.trim() || null,
    status: (formData.get("status") as string | null)?.trim() || "upcoming",
    title: (formData.get("title") as string | null)?.trim() || "",
  };

  const { error } = await supabase.from("project").update(payload).eq("id", id);

  if (error) {
    const msg = encodeURIComponent(error.message);
    redirect(`/app/projets/${id}?error=${msg}`);
  }

  redirect(`/app/projets/${id}?notice=Projet+mis+à+jour`);
}
