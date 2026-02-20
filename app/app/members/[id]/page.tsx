import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Fiche membre
          </p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">{id}</h2>
        </div>
        <Badge variant="success">active</Badge>
      </div>

      <Card className="space-y-2">
        <CardTitle>Informations</CardTitle>
        <CardDescription>
          Ecran de lecture/edition qui sera branche sur `public.member`.
        </CardDescription>
      </Card>

      <Card>
        <form className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="member-first-name">
              Prenom
            </label>
            <Input id="member-first-name" defaultValue="Afiwa" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="member-last-name">
              Nom
            </label>
            <Input id="member-last-name" defaultValue="Mensah" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="member-phone">
              Telephone
            </label>
            <Input id="member-phone" defaultValue="+228 90 00 00 00" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="member-status">
              Status
            </label>
            <Select id="member-status" defaultValue="active">
              <option value="active">Actif</option>
              <option value="pending">En attente</option>
              <option value="suspended">Suspendu</option>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Button type="submit">Enregistrer</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
