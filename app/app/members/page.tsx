import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const members = [
  {
    id: "MEM-001",
    fullName: "Afiwa Mensah",
    status: "active",
    location: "Region Maritime / Prefecture Golfe / Commune Lome 1",
  },
  {
    id: "MEM-002",
    fullName: "Koffi Adjaho",
    status: "pending",
    location: "Region Plateaux / Prefecture Kloto / Commune Kpalime",
  },
  {
    id: "MEM-003",
    fullName: "Akosua Agbo",
    status: "suspended",
    location: "Region Centrale / Prefecture Tchaoudjo / Commune Sokode",
  },
];

function statusVariant(status: string): "success" | "warning" | "danger" | "default" {
  if (status === "active") return "success";
  if (status === "pending") return "warning";
  if (status === "suspended") return "danger";
  return "default";
}

export default function MembersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Membres</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">Liste & filtres</h2>
        </div>
        <Button variant="secondary">Exporter</Button>
      </div>

      <Card className="space-y-4">
        <CardTitle className="text-base">Recherche</CardTitle>
        <div className="grid gap-3 md:grid-cols-4">
          <Input placeholder="Rechercher un membre..." />
          <Select defaultValue="">
            <option value="" disabled>
              Filtrer status
            </option>
            <option value="active">Actif</option>
            <option value="pending">En attente</option>
            <option value="suspended">Suspendu</option>
          </Select>
          <Select defaultValue="">
            <option value="" disabled>
              Region
            </option>
          </Select>
          <Select defaultValue="">
            <option value="" disabled>
              Prefecture / Commune
            </option>
          </Select>
        </div>
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[720px] text-left">
          <thead className="bg-muted-surface">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
                ID
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
                Nom
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
                Localisation
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
                Statut
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id} className="border-t border-border">
                <td className="px-4 py-3 text-sm font-medium">{member.id}</td>
                <td className="px-4 py-3 text-sm">{member.fullName}</td>
                <td className="px-4 py-3 text-sm text-muted">{member.location}</td>
                <td className="px-4 py-3 text-sm">
                  <Badge variant={statusVariant(member.status)}>{member.status}</Badge>
                </td>
                <td className="px-4 py-3 text-sm">
                  <Link className="font-semibold text-primary" href={`/app/members/${member.id}`}>
                    Voir detail
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
