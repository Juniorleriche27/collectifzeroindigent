"use server";

import { revalidatePath } from "next/cache";

import { updateCurrentMember } from "@/lib/backend/api";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type SettingsState = {
  error: string | null;
  success: string | null;
};

function formValue(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export async function updateAccountSettings(
  _previousState: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  if (!isSupabaseConfigured) {
    return {
      error: "Supabase non configure.",
      success: null,
    };
  }

  const firstName = formValue(formData, "first_name");
  const lastName = formValue(formData, "last_name");
  const phone = formValue(formData, "phone");
  const email = formValue(formData, "email");

  if (!firstName || !lastName || !phone) {
    return {
      error: "Prenom, nom et telephone sont obligatoires.",
      success: null,
    };
  }

  try {
    await updateCurrentMember({
      email: email || null,
      first_name: firstName,
      last_name: lastName,
      phone,
    });
  } catch (error) {
    return {
      error: toErrorMessage(error, "Impossible de mettre a jour votre compte."),
      success: null,
    };
  }

  revalidatePath("/app/parametres");
  revalidatePath("/app/membres");

  return {
    error: null,
    success: "Informations mises a jour.",
  };
}

export async function updateSecuritySettings(
  _previousState: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  if (!isSupabaseConfigured) {
    return {
      error: "Supabase non configure.",
      success: null,
    };
  }

  const newPassword = formValue(formData, "new_password");
  const confirmPassword = formValue(formData, "confirm_password");

  if (!newPassword || !confirmPassword) {
    return {
      error: "Renseignez le nouveau mot de passe et sa confirmation.",
      success: null,
    };
  }

  if (newPassword.length < 8) {
    return {
      error: "Le mot de passe doit contenir au moins 8 caracteres.",
      success: null,
    };
  }

  if (newPassword !== confirmPassword) {
    return {
      error: "La confirmation du mot de passe ne correspond pas.",
      success: null,
    };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      return {
        error: error.message,
        success: null,
      };
    }
  } catch (error) {
    return {
      error: toErrorMessage(error, "Impossible de mettre a jour la securite."),
      success: null,
    };
  }

  revalidatePath("/app/parametres");

  return {
    error: null,
    success: "Mot de passe mis a jour.",
  };
}

export async function updateNotificationSettings(
  _previousState: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  if (!isSupabaseConfigured) {
    return {
      error: "Supabase non configure.",
      success: null,
    };
  }

  const emailUpdates = formValue(formData, "email_updates") !== "disabled";
  const securityAlerts = formValue(formData, "security_alerts") !== "disabled";

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({
      data: {
        czi_notifications: {
          email_updates: emailUpdates,
          security_alerts: securityAlerts,
        },
      },
    });

    if (error) {
      return {
        error: error.message,
        success: null,
      };
    }
  } catch (error) {
    return {
      error: toErrorMessage(error, "Impossible de mettre a jour les notifications."),
      success: null,
    };
  }

  revalidatePath("/app/parametres");

  return {
    error: null,
    success: "Preferences de notifications mises a jour.",
  };
}
