"use client";

import { useActionState, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

import {
  updateAccountSettings,
  updateNotificationSettings,
  updateSecuritySettings,
} from "./actions";
import type { SettingsState } from "./actions";

const tabs = ["Compte", "Securite", "Notifications", "Roles"] as const;
type TabName = (typeof tabs)[number];

type ParametresClientProps = {
  defaults: {
    email: string;
    firstName: string;
    lastName: string;
    notifications: {
      emailUpdates: boolean;
      securityAlerts: boolean;
    };
    phone: string;
    role: string;
  };
};

export function ParametresClient({ defaults }: ParametresClientProps) {
  const initialSettingsState: SettingsState = {
    error: null,
    success: null,
  };
  const [activeTab, setActiveTab] = useState<TabName>("Compte");
  const [accountState, accountAction, accountPending] = useActionState(
    updateAccountSettings,
    initialSettingsState,
  );
  const [securityState, securityAction, securityPending] = useActionState(
    updateSecuritySettings,
    initialSettingsState,
  );
  const [notificationState, notificationAction, notificationPending] = useActionState(
    updateNotificationSettings,
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
          {accountState.error ? (
            <p className="md:col-span-2 text-sm text-red-600">{accountState.error}</p>
          ) : null}
          {accountState.success ? (
            <p className="md:col-span-2 text-sm text-emerald-700">{accountState.success}</p>
          ) : null}
          <div className="md:col-span-2">
            <Button disabled={accountPending} type="submit">
              {accountPending ? "Mise a jour..." : "Mettre a jour"}
            </Button>
          </div>
        </form>
      );
    }

    if (activeTab === "Securite") {
      return (
        <form action={securityAction} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium" htmlFor="current-password">
              Mot de passe actuel
            </label>
            <Input id="current-password" name="current_password" type="password" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="new-password">
              Nouveau mot de passe
            </label>
            <Input id="new-password" name="new_password" type="password" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="new-password-confirm">
              Confirmer le mot de passe
            </label>
            <Input id="new-password-confirm" name="confirm_password" type="password" required />
          </div>
          <p className="text-xs text-muted md:col-span-2">
            Supabase peut exiger une re-authentification recente pour le changement de mot de
            passe.
          </p>
          {securityState.error ? (
            <p className="md:col-span-2 text-sm text-red-600">{securityState.error}</p>
          ) : null}
          {securityState.success ? (
            <p className="md:col-span-2 text-sm text-emerald-700">{securityState.success}</p>
          ) : null}
          <div className="md:col-span-2">
            <Button disabled={securityPending} type="submit">
              {securityPending ? "Mise a jour..." : "Mettre a jour la securite"}
            </Button>
          </div>
        </form>
      );
    }

    if (activeTab === "Notifications") {
      return (
        <form action={notificationAction} className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="font-medium">Notifications email</p>
              <p className="text-sm text-muted">Recevoir les mises a jour membres par email.</p>
            </div>
            <Select
              defaultValue={defaults.notifications.emailUpdates ? "enabled" : "disabled"}
              name="email_updates"
            >
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
            <Select
              defaultValue={defaults.notifications.securityAlerts ? "enabled" : "disabled"}
              name="security_alerts"
            >
              <option value="enabled">Active</option>
              <option value="disabled">Desactive</option>
            </Select>
          </div>
          {notificationState.error ? (
            <p className="text-sm text-red-600">{notificationState.error}</p>
          ) : null}
          {notificationState.success ? (
            <p className="text-sm text-emerald-700">{notificationState.success}</p>
          ) : null}
          <Button disabled={notificationPending} type="submit">
            {notificationPending ? "Mise a jour..." : "Enregistrer les notifications"}
          </Button>
        </form>
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
            <label className="text-sm font-medium">
              Role principal
            </label>
            <div className="rounded-lg border border-border bg-muted-surface p-3">
              <Badge>{defaults.role}</Badge>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Portee
            </label>
            <div className="rounded-lg border border-border bg-muted-surface p-3 text-sm text-muted">
              Controle par les policies RLS et les mandats metier.
            </div>
          </div>
        </div>
      </div>
    );
  }, [
    accountAction,
    accountPending,
    accountState.error,
    accountState.success,
    activeTab,
    defaults.email,
    defaults.firstName,
    defaults.lastName,
    defaults.notifications.emailUpdates,
    defaults.notifications.securityAlerts,
    defaults.phone,
    defaults.role,
    notificationAction,
    notificationPending,
    notificationState.error,
    notificationState.success,
    securityAction,
    securityPending,
    securityState.error,
    securityState.success,
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
