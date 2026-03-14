"use server";

import { revalidatePath } from "next/cache";

import { redirect } from "next/navigation";

import {
  createDonation,
  createPaydunyaDonationCheckout,
  updateDonation,
  type DonationStatus,
} from "@/lib/backend/api";
import { isSupabaseConfigured } from "@/lib/supabase/config";

import { donationPaymentMode, getDonationManualPaymentMessage } from "./payment-config";

export type DonationActionState = {
  error: string | null;
  success: string | null;
};

export type DonationCheckoutActionState = {
  error: string | null;
  success: string | null;
};

function formValue(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function parseStatus(value: string): DonationStatus | null {
  if (
    value === "pledged" ||
    value === "pending" ||
    value === "paid" ||
    value === "failed" ||
    value === "cancelled" ||
    value === "refunded"
  ) {
    return value;
  }
  return null;
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export async function createDonationAction(
  _previousState: DonationActionState,
  formData: FormData,
): Promise<DonationActionState> {
  if (!isSupabaseConfigured) {
    return { error: "Supabase non configuré.", success: null };
  }

  const amountRaw = formValue(formData, "amount_cfa");
  const amount = Number.parseInt(amountRaw, 10);
  const message = formValue(formData, "message");

  if (!Number.isFinite(amount) || amount < 100) {
    return { error: "Le montant minimum est 100 CFA.", success: null };
  }

  try {
    const paymentProvider =
      donationPaymentMode === "paydunya" ? "paydunya" : "manual_mobile_money";
    const response = await createDonation({
      amount_cfa: amount,
      message: message || undefined,
      payment_provider: paymentProvider,
    });

    if (donationPaymentMode === "manual") {
      revalidatePath("/app/dons");
      return {
        error: null,
        success: getDonationManualPaymentMessage(amount),
      };
    }

    const checkoutResponse = await createPaydunyaDonationCheckout(response.item.id, {
      description: message || undefined,
    });
    revalidatePath("/app/dons");
    redirect(checkoutResponse.invoice_url);
  } catch (error) {
    return {
      error: toErrorMessage(error, "Impossible d'enregistrer ce don."),
      success: null,
    };
  }
}

export async function updateDonationStatusAction(
  _previousState: DonationActionState,
  formData: FormData,
): Promise<DonationActionState> {
  if (!isSupabaseConfigured) {
    return { error: "Supabase non configuré.", success: null };
  }

  const donationId = formValue(formData, "donation_id");
  const status = parseStatus(formValue(formData, "status").toLowerCase());

  if (!donationId) {
    return { error: "Don introuvable.", success: null };
  }
  if (!status) {
    return { error: "Statut invalide.", success: null };
  }

  try {
    const response = await updateDonation(donationId, { status });
    revalidatePath("/app/dons");
    return {
      error: null,
      success: response.message || "Don mis à jour.",
    };
  } catch (error) {
    return {
      error: toErrorMessage(error, "Impossible de mettre à jour ce don."),
      success: null,
    };
  }
}

export async function startDonationPaydunyaCheckoutAction(
  _previousState: DonationCheckoutActionState,
  formData: FormData,
): Promise<DonationCheckoutActionState> {
  if (!isSupabaseConfigured) {
    return { error: "Supabase non configuré.", success: null };
  }

  const donationId = formValue(formData, "donation_id");
  if (!donationId) {
    return { error: "Don introuvable.", success: null };
  }

  if (donationPaymentMode === "manual") {
    return {
      error: null,
      success:
        "Le paiement en ligne est temporairement remplace par une validation manuelle via les numeros mobiles affiches plus haut.",
    };
  }

  try {
    const response = await createPaydunyaDonationCheckout(donationId);
    revalidatePath("/app/dons");
    redirect(response.invoice_url);
  } catch (error) {
    return {
      error: toErrorMessage(error, "Impossible de démarrer le paiement en ligne."),
      success: null,
    };
  }
}
