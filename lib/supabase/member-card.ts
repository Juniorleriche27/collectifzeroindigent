import { createClient } from "@/lib/supabase/server";
import { getMemberForUser } from "@/lib/supabase/member";
import { getProfileRoleByAuthUser } from "@/lib/supabase/profile";

export type MemberCardRequestRecord = {
  id: string;
  requested: boolean;
  price_cfa: number;
  payment_status: string;
  payment_provider: string | null;
  payment_ref: string | null;
  card_status: string;
  card_number: string | null;
  card_pdf_url: string | null;
  card_png_url: string | null;
  printed_at: string | null;
  delivered_at: string | null;
  delivery_mode: string | null;
  delivery_contact: string | null;
  delivery_address: string | null;
  created_at: string;
  updated_at: string;
};

export type MemberCardMemberRecord = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  photo_url: string | null;
  photo_status: string;
  photo_rejection_reason: string | null;
};

export type MemberCardOverview = {
  canManage: boolean;
  member: MemberCardMemberRecord | null;
  request: MemberCardRequestRecord | null;
  role: string | null;
};

export async function getCurrentMemberCardOverview(): Promise<MemberCardOverview> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    return {
      canManage: false,
      member: null,
      request: null,
      role: null,
    };
  }

  const [{ role, error: roleError }, linkedMember] = await Promise.all([
    getProfileRoleByAuthUser(supabase, user.id),
    getMemberForUser(user.id),
  ]);

  if (roleError) {
    throw roleError;
  }

  if (!linkedMember?.id) {
    return {
      canManage: false,
      member: null,
      request: null,
      role: role ?? "member",
    };
  }

  const [memberResult, requestResult] = await Promise.all([
    supabase
      .from("member")
      .select(
        "id, first_name, last_name, email, phone, photo_url, photo_status, photo_rejection_reason",
      )
      .eq("id", linkedMember.id)
      .maybeSingle(),
    supabase
      .from("member_card_request")
      .select(
        "id, requested, price_cfa, payment_status, payment_provider, payment_ref, card_status, card_number, card_pdf_url, card_png_url, printed_at, delivered_at, delivery_mode, delivery_contact, delivery_address, created_at, updated_at",
      )
      .eq("member_id", linkedMember.id)
      .maybeSingle(),
  ]);

  if (memberResult.error) {
    throw memberResult.error;
  }
  if (requestResult.error) {
    throw requestResult.error;
  }

  return {
    canManage: role === "admin" || role === "ca" || role === "cn" || role === "pf",
    member: memberResult.data,
    request: requestResult.data,
    role: role ?? "member",
  };
}
