import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export default function OnboardingPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-10">
      <Card>
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">
          Etape obligatoire
        </p>
        <CardTitle className="mt-2">Onboarding membre</CardTitle>
        <CardDescription className="mt-2">
          Cette page preparera la creation de `member` puis la mise a jour de
          `profile.member_id`.
        </CardDescription>
        <form className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="first-name">
              Prenom
            </label>
            <Input id="first-name" placeholder="Ex: Afiwa" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="last-name">
              Nom
            </label>
            <Input id="last-name" placeholder="Ex: Mensah" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="phone">
              Telephone
            </label>
            <Input id="phone" placeholder="+228 90 00 00 00" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email-optional">
              Email (optionnel)
            </label>
            <Input id="email-optional" type="email" placeholder="vous@exemple.com" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="region">
              Region
            </label>
            <Select id="region" defaultValue="">
              <option value="" disabled>
                Selectionner une region
              </option>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="prefecture">
              Prefecture
            </label>
            <Select id="prefecture" defaultValue="">
              <option value="" disabled>
                Selectionner une prefecture
              </option>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="commune">
              Commune
            </label>
            <Select id="commune" defaultValue="">
              <option value="" disabled>
                Selectionner une commune
              </option>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="join-mode-onboarding">
              Type d&apos;inscription
            </label>
            <Select id="join-mode-onboarding" defaultValue="personal">
              <option value="personal">Personal</option>
              <option value="association">Association</option>
              <option value="enterprise">Enterprise</option>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium" htmlFor="org-name">
              Nom organisation (si association/enterprise)
            </label>
            <Input id="org-name" placeholder="Nom de l'organisation" />
          </div>
          <div className="md:col-span-2">
            <Button size="lg" type="submit">
              Terminer l&apos;onboarding
            </Button>
          </div>
        </form>
      </Card>
    </main>
  );
}
