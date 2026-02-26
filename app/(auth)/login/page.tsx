"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { CziBrand } from "@/components/branding/czi-brand";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!isSupabaseConfigured) {
      setErrorMessage("Supabase non configure. Ajoutez les variables d'environnement.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      const rawNextPath = new URLSearchParams(window.location.search).get("next");
      const targetPath =
        rawNextPath && rawNextPath.startsWith("/") ? rawNextPath : "/app/dashboard";
      router.replace(targetPath);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CziBrand subtitle={false} />
      <CardTitle className="mt-2">Connexion</CardTitle>
      <CardDescription className="mt-2">
        Accedez a votre espace membre pour continuer.
      </CardDescription>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="email">
            Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="vous@exemple.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="password">
            Mot de passe
          </label>
          <Input
            id="password"
            type="password"
            placeholder="********"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>
        {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
        <Button className="w-full" type="submit" disabled={loading}>
          {loading ? "Connexion..." : "Se connecter"}
        </Button>
      </form>
      <p className="mt-6 text-sm text-muted">
        Pas encore de compte?{" "}
        <Link className="font-semibold text-primary" href="/signup">
          Creer un compte
        </Link>
      </p>
    </Card>
  );
}
