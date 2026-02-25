"use client";

import { useActionState } from "react";
import { LifeBuoy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import type { SupportAiHistoryItem } from "@/lib/backend/api";

import { askSupportAiAction, type SupportAskState } from "./actions";

type SupportClientProps = {
  dailyLimit: number;
  disclaimer: string;
  items: SupportAiHistoryItem[];
  loadError: string | null;
  remainingToday: number;
  usedToday: number;
};

export function SupportClient({
  dailyLimit,
  disclaimer,
  items,
  loadError,
  remainingToday,
  usedToday,
}: SupportClientProps) {
  const initialState: SupportAskState = { error: null, success: null };
  const [askState, askAction, askPending] = useActionState(askSupportAiAction, initialState);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">Support</p>
        <h2 className="mt-1 text-3xl font-semibold tracking-tight">Centre d&apos;aide IA (Cohere)</h2>
        <CardDescription className="mt-2">
          Posez une question produit CZI. Historique personnel conserve.
        </CardDescription>
      </div>

      <Card className="space-y-3">
        <CardTitle className="text-base">Usage</CardTitle>
        <CardDescription>
          Utilise aujourd&apos;hui: <span className="font-semibold text-foreground">{usedToday}</span> /{" "}
          {dailyLimit} | Restant:{" "}
          <span className="font-semibold text-foreground">{remainingToday}</span>
        </CardDescription>
        <CardDescription className="text-amber-700">{disclaimer}</CardDescription>
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-muted-surface p-2 text-muted">
            <LifeBuoy size={20} />
          </div>
          <CardTitle className="text-base">Nouvelle question</CardTitle>
        </div>
        <form action={askAction} className="space-y-3">
          <textarea
            className="min-h-[130px] w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/20"
            name="question"
            placeholder="Ex: Comment approuver un membre pending et changer sa cellule ?"
            required
          />
          {askState.error ? <p className="text-sm text-red-600">{askState.error}</p> : null}
          {askState.success ? <p className="text-sm text-emerald-700">{askState.success}</p> : null}
          <Button disabled={askPending || remainingToday <= 0} type="submit">
            {askPending ? "Envoi..." : "Envoyer au support IA"}
          </Button>
        </form>
      </Card>

      {loadError ? (
        <Card>
          <CardDescription className="text-red-600">{loadError}</CardDescription>
        </Card>
      ) : null}

      <Card className="space-y-4">
        <CardTitle className="text-base">Historique Q/R</CardTitle>
        {items.length === 0 ? (
          <CardDescription>Aucune question pour le moment.</CardDescription>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div className="rounded-lg border border-border p-4" key={item.id}>
                <p className="text-xs text-muted-foreground">
                  {new Date(item.created_at).toLocaleString("fr-FR")} | {item.provider}
                  {item.model ? ` (${item.model})` : ""}
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">Q: {item.question}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">R: {item.answer}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

