import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export default function SignupPage() {
  return (
    <Card>
      <p className="text-sm font-semibold uppercase tracking-wider text-primary">CZI</p>
      <CardTitle className="mt-2">Inscription</CardTitle>
      <CardDescription className="mt-2">
        Creez un compte pour demarrer votre onboarding.
      </CardDescription>
      <form className="mt-6 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="signup-email">
            Email
          </label>
          <Input id="signup-email" type="email" placeholder="vous@exemple.com" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="signup-password">
            Mot de passe
          </label>
          <Input id="signup-password" type="password" placeholder="Choisissez un mot de passe" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="join-mode">
            Type d&apos;inscription
          </label>
          <Select id="join-mode" defaultValue="personal">
            <option value="personal">Personal</option>
            <option value="association">Association</option>
            <option value="enterprise">Enterprise</option>
          </Select>
        </div>
        <Button className="w-full" type="submit">
          Creer mon compte
        </Button>
      </form>
      <p className="mt-6 text-sm text-muted">
        Deja inscrit ?{" "}
        <Link className="font-semibold text-primary" href="/login">
          Se connecter
        </Link>
      </p>
    </Card>
  );
}
