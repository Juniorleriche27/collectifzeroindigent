import { createClient } from "@/lib/supabase/server";
import { getProfileRoleByAuthUser } from "@/lib/supabase/profile";

export type ProjectStatus = "upcoming" | "active" | "completed" | "cancelled";

export type ProjectRecord = {
  cover_image_url: string | null;
  created_at: string;
  created_by: string | null;
  description: string | null;
  end_date: string | null;
  id: string;
  is_published: boolean;
  location: string | null;
  short_description: string | null;
  start_date: string | null;
  status: ProjectStatus;
  title: string;
  updated_at: string;
};

export type ProjectsOverview = {
  canManage: boolean;
  items: ProjectRecord[];
  role: string | null;
};

export async function listProjects(): Promise<ProjectsOverview> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { canManage: false, items: [], role: null };
  }

  const { role } = await getProfileRoleByAuthUser(supabase, user.id);
  const canManage = role === "admin" || role === "ca" || role === "cn" || role === "pf";

  const { data, error } = await supabase
    .from("project")
    .select("id, title, short_description, description, status, cover_image_url, start_date, end_date, location, is_published, created_by, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;

  return {
    canManage,
    items: (data ?? []) as ProjectRecord[],
    role,
  };
}

export async function getProjectById(id: string): Promise<{ canManage: boolean; item: ProjectRecord | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let canManage = false;
  if (user) {
    const { role } = await getProfileRoleByAuthUser(supabase, user.id);
    canManage = role === "admin" || role === "ca" || role === "cn" || role === "pf";
  }

  const { data, error } = await supabase
    .from("project")
    .select("id, title, short_description, description, status, cover_image_url, start_date, end_date, location, is_published, created_by, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;

  return { canManage, item: data as ProjectRecord | null };
}
