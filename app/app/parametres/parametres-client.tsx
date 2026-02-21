"use client";

import { useActionState, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { updateAccountSettings } from "./actions";
import type { SettingsState } from "./actions";

const tabs = ["Compte", "Securite", "Notifications", "Roles"] as const;
type TabName = (typeof tabs)[number];

type ParametresClientProps = {
  defaults: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
};

export function ParametresClient({ defaults }: ParametresClientProps) {
  const initialSettingsState: SettingsState = {
    error: null,
    success: null,
  };
  const [activeTab, setActiveTab] = useState<TabName>("Compte");
  const [state, accountAction, isPending] = useActionState(
    updateAccountSettings,
    initialSettingsState,
  );

  const tabContent = useMemo(() => {
    if (activeTab === "Compte") {
      return (
        <form action={accountAction} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="account-first-name">
              Prenom
            </label>
            <Input
              defaultValue={defaults.firstName}
              id="account-first-name"
              name="first_name"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="account-last-name">
              Nom
            </label>
            <Input
              defaultValue={defaults.lastName}
              id="account-last-name"
              name="last_name"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="account-phone">
              Telephone
            </label>
            <Input defaultValue={defaults.phone} id="account-phone" name="phone" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="account-email">
              Email
            </label>
            <Input defaultValue={defaults.email} id="account-email" name="email" type="email" />
          </div>
          {state.error ? <p className="md:col-span-2 text-sm text-red-600">{state.error}</p> : null}
          {state.success ? (
            <p className="md:col-span-2 text-sm text-emerald-700">{state.success}</p>
          ) : null}
          <div className="md:col-span-2">
            <Button disabled={isPending} type="submit">
              {isPending ? "Mise a jour..." : "Mettre a jour"}
            </Button>
          </div>
        </form>
      );
    }

    if (activeTab === "Securite") {
      return (
        <form className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium" htmlFor="current-password">
              Mot de passe actuel
            </label>
            <Input id="current-password" type="password" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="new-password">
              Nouveau mot de passe
            </label>
            <Input id="new-password" type="password" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="new-password-confirm">
              Confirmer le mot de passe
            </label>
            <Input id="new-password-confirm" type="password" />
          </div>
          <div className="md:col-span-2">
            <Button type="button">Mettre a jour la securite</Button>
          </div>
        </form>
      );
    }

    if (activeTab === "Notifications") {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="font-medium">Notifications email</p>
              <p className="text-sm text-muted">Recevoir les mises a jour membres par email.</p>
            </div>
            <Select defaultValue="enabled">
              <option value="enabled">Active</option>
              <option value="disabled">Desactive</option>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="font-medium">Alertes securite</p>
              <p className="text-sm text-muted">
                Recevoir une alerte en cas de connexion suspecte.
              </p>
            </div>
            <Select defaultValue="enabled">
              <option value="enabled">Active</option>
              <option value="disabled">Desactive</option>
            </Select>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <CardDescription>
          Configuration de role UI. Le role final reste controle par la base
          (`public.profile.role`).
        </CardDescription>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="role-default">
              Role principal
            </label>
            <Select id="role-default" defaultValue="member">
              <option value="member">member</option>
              <option value="responsable">responsable</option>
              <option value="admin">admin</option>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="role-scope">
              Portee
            </label>
            <Select id="role-scope" defaultValue="personnel">
              <option value="personnel">Personnel</option>
              <option value="regional">Regional</option>
              <option value="national">National</option>
            </Select>
          </div>
        </div>
        <Button type="button">Enregistrer les roles</Button>
      </div>
    );
  }, [
    accountAction,
    activeTab,
    defaults.email,
    defaults.firstName,
    defaults.lastName,
    defaults.phone,
    isPending,
    state.error,
    state.success,
  ]);

  return (
    <Card>
      <div className="flex flex-wrap gap-2 border-b border-border pb-4">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              activeTab === tab
                ? "bg-foreground text-background"
                : "bg-muted-surface text-muted hover:text-foreground",
            )}
            onClick={() => setActiveTab(tab)}
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="pt-6">{tabContent}</div>
    </Card>
  );
}
