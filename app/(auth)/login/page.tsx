"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!isSupabaseConfigured) {
      setErrorMessage("Supabase non configuré. Ajoutez les variables d'environnement.");
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
        Accédez a votre espace membre pour continuer.
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
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="********"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <p className="text-right text-sm">
          <Link className="font-semibold text-primary" href="/forgot-password">
            Mot de passe oublié ?
          </Link>
        </p>
        {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
        <Button className="w-full" type="submit" disabled={loading}>
          {loading ? "Connexion..." : "Se connecter"}
        </Button>
      </form>
      <p className="mt-6 text-sm text-muted">
        Pas encore de compte ?{" "}
        <Link className="font-semibold text-primary" href="/signup">
          Créer un compte
        </Link>
      </p>
    </Card>
  );
}
