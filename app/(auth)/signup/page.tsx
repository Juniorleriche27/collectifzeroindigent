"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [joinMode, setJoinMode] = useState("personal");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    if (!isSupabaseConfigured) {
      setErrorMessage("Supabase non configure. Ajoutez les variables d'environnement.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            join_mode: joinMode,
          },
        },
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      if (data.session) {
        router.replace("/onboarding");
        router.refresh();
        return;
      }

      setInfoMessage(
        "Compte cree. Verifiez votre email pour confirmer l'inscription, puis connectez-vous.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <p className="text-sm font-semibold uppercase tracking-wider text-primary">CZI</p>
      <CardTitle className="mt-2">Inscription</CardTitle>
      <CardDescription className="mt-2">
        Creez un compte pour demarrer votre onboarding.
      </CardDescription>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="signup-email">
            Email
          </label>
          <Input
            id="signup-email"
            type="email"
            placeholder="vous@exemple.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="signup-password">
            Mot de passe
          </label>
          <Input
            id="signup-password"
            type="password"
            placeholder="Choisissez un mot de passe"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="signup-password-confirm">
            Confirmer le mot de passe
          </label>
          <Input
            id="signup-password-confirm"
            type="password"
            placeholder="Retapez le mot de passe"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="join-mode">
            Type d&apos;inscription
          </label>
          <Select
            id="join-mode"
            value={joinMode}
            onChange={(event) => setJoinMode(event.target.value)}
          >
            <option value="personal">Personal</option>
            <option value="association">Association</option>
            <option value="enterprise">Enterprise</option>
          </Select>
        </div>
        {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
        {infoMessage ? <p className="text-sm text-emerald-700">{infoMessage}</p> : null}
        <Button className="w-full" type="submit" disabled={loading}>
          {loading ? "Creation..." : "Creer mon compte"}
        </Button>
      </form>
      <p className="mt-6 text-sm text-muted">
        Deja inscrit?{" "}
        <Link className="font-semibold text-primary" href="/login">
          Se connecter
        </Link>
      </p>
    </Card>
  );
}
