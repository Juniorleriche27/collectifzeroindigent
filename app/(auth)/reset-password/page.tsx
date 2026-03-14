"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { CziBrand } from "@/components/branding/czi-brand";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [canReset, setCanReset] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function checkSession() {
      if (!isSupabaseConfigured) {
        if (active) {
          setCheckingSession(false);
          setCanReset(false);
        }
        return;
      }

      const supabase = createClient();
      const { data, error } = await supabase.auth.getSession();
      if (!active) return;

      if (error || !data.session) {
        setCanReset(false);
      } else {
        setCanReset(true);
      }
      setCheckingSession(false);
    }

    void checkSession();
    return () => {
      active = false;
    };
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    if (!isSupabaseConfigured) {
      setErrorMessage("Supabase non configuré. Ajoutez les variables d'environnement.");
      return;
    }

    if (!canReset) {
      setErrorMessage("Session de réinitialisation invalide ou expirée.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("La confirmation ne correspond pas.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setInfoMessage("Mot de passe mis à jour. Redirection vers la connexion...");
      setTimeout(() => {
        router.replace("/login");
        router.refresh();
      }, 1200);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CziBrand subtitle={false} />
      <CardTitle className="mt-2">Réinitialiser le mot de passe</CardTitle>
      <CardDescription className="mt-2">
        Définissez un nouveau mot de passe pour votre compte.
      </CardDescription>
      {checkingSession ? (
        <p className="mt-6 text-sm text-muted">Vérification de la session...</p>
      ) : !canReset ? (
        <p className="mt-6 text-sm text-red-600">
          Lien invalide ou expiré. Redemandez un nouvel e-mail de réinitialisation.
        </p>
      ) : (
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="reset-password">
              Nouveau mot de passe
            </label>
            <Input
              id="reset-password"
              type="password"
              placeholder="Nouveau mot de passe"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="reset-password-confirm">
              Confirmer le mot de passe
            </label>
            <Input
              id="reset-password-confirm"
              type="password"
              placeholder="Confirmez le mot de passe"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
          </div>
          {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
          {infoMessage ? <p className="text-sm text-emerald-700">{infoMessage}</p> : null}
          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? "Mise à jour..." : "Mettre à jour"}
          </Button>
        </form>
      )}
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

