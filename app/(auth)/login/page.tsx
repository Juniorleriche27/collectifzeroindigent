import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  return (
    <Card>
      <p className="text-sm font-semibold uppercase tracking-wider text-primary">CZI</p>
      <CardTitle className="mt-2">Connexion</CardTitle>
      <CardDescription className="mt-2">
        Accedez a votre espace membre pour continuer.
      </CardDescription>
      <form className="mt-6 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="email">
            Email
          </label>
          <Input id="email" type="email" placeholder="vous@exemple.com" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="password">
            Mot de passe
          </label>
          <Input id="password" type="password" placeholder="••••••••" />
        </div>
        <Button className="w-full" type="submit">
          Se connecter
        </Button>
      </form>
      <p className="mt-6 text-sm text-muted">
        Pas encore de compte ?{" "}
        <Link className="font-semibold text-primary" href="/signup">
          Creer un compte
        </Link>
      </p>
    </Card>
  );
}
