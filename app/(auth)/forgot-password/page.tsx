"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { CziBrand } from "@/components/branding/czi-brand";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    if (!isSupabaseConfigured) {
      setErrorMessage("Supabase non configuré. Ajoutez les variables d'environnement.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setInfoMessage(
        "Un email de réinitialisation a été envoye. Ouvrez le lien pour définir un nouveau mot de passe.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CziBrand subtitle={false} />
      <CardTitle className="mt-2">Mot de passe oublié</CardTitle>
      <CardDescription className="mt-2">
        Saisissez votre email pour recevoir un lien de réinitialisation.
      </CardDescription>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="forgot-email">
            Email
          </label>
          <Input
            id="forgot-email"
            type="email"
            placeholder="vous@exemple.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
        {infoMessage ? <p className="text-sm text-emerald-700">{infoMessage}</p> : null}
        <Button className="w-full" type="submit" disabled={loading}>
          {loading ? "Envoi..." : "Envoyer le lien"}
        </Button>
      </form>
      <p className="mt-6 text-sm text-muted">
        Retour à la{" "}
        <Link className="font-semibold text-primary" href="/login">
          connexion
        </Link>
        .
      </p>
    </Card>
  );
}

