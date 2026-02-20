import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">Mon profil</p>
        <h2 className="mt-1 text-3xl font-semibold tracking-tight">Informations personnelles</h2>
      </div>
      <Card>
        <CardTitle>Profil utilisateur</CardTitle>
        <CardDescription className="mt-2">
          Cette section lira `public.profile` et synchronisera les champs exposes au membre.
        </CardDescription>
        <form className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="profile-first-name">
              Prenom
            </label>
            <Input id="profile-first-name" defaultValue="Afiwa" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="profile-last-name">
              Nom
            </label>
            <Input id="profile-last-name" defaultValue="Mensah" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="profile-email">
              Email
            </label>
            <Input id="profile-email" defaultValue="afiwa@czi.org" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="profile-phone">
              Telephone
            </label>
            <Input id="profile-phone" defaultValue="+228 90 00 00 00" />
          </div>
          <div className="md:col-span-2">
            <Button type="submit">Mettre a jour</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
