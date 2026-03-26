import { createClient } from "@/lib/supabase/server";
import { getProfileRoleByAuthUser } from "@/lib/supabase/profile";

export const REPORT_FILES_BUCKET = "activity-reports";

export type ActivityReportRecord = {
  created_at: string;
  created_by: string | null;
  description: string | null;
  file_name: string | null;
  file_size_bytes: number | null;
  file_url: string | null;
  id: string;
  is_public: boolean;
  is_published: boolean;
  project_id: string | null;
  project_title?: string | null;
  published_at: string | null;
  title: string;
  updated_at: string;
};

export type ReportsOverview = {
  canManage: boolean;
  items: ActivityReportRecord[];
  role: string | null;
};

export async function listReports(): Promise<ReportsOverview> {
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
    .from("activity_report")
    .select(
      "id, title, description, file_url, file_name, file_size_bytes, is_published, is_public, published_at, project_id, created_by, created_at, updated_at, project:project_id(title)",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw error;

  const items = ((data ?? []) as unknown[]).map((row) => {
    const r = row as Record<string, unknown>;
    const project = r["project"] as { title?: string } | null;
    return {
      ...r,
      project_title: project?.title ?? null,
      project: undefined,
    } as unknown as ActivityReportRecord;
  });

  return { canManage, items, role };
}

export async function getReportDownloadUrl(fileUrl: string): Promise<string | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from(REPORT_FILES_BUCKET)
    .createSignedUrl(fileUrl, 60 * 60);

  if (error) {
    console.error("Unable to create signed URL for report", error);
    return null;
  }

  return data.signedUrl;
}
