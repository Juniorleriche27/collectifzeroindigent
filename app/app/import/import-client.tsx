"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

import { importOnboardingSheet, type ImportOnboardingState } from "./actions";

const initialState: ImportOnboardingState = {
  error: null,
  message: null,
  report: [],
  summary: null,
};

export function ImportClient() {
  const [state, formAction, isPending] = useActionState(importOnboardingSheet, initialState);

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <CardTitle>Importer une fiche onboarding</CardTitle>
        <CardDescription>
          Import CSV, Excel ou JSON des fiches onboarding existantes. Le matching se fait par `id`,
          puis `email`, puis `phone`. L&apos;import met a jour des membres deja visibles selon vos
          droits RLS.
        </CardDescription>

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="onboarding-file">
              Fichier onboarding
            </label>
            <input
              accept=".csv,.xlsx,.xls,application/json,.json,text/csv"
              className="block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
              id="onboarding-file"
              name="file"
              required
              type="file"
            />
          </div>
          <div className="rounded-md border border-border bg-muted-surface/50 p-3 text-sm text-muted-foreground">
            Utilisez de preference le fichier exporte depuis la rubrique Export. Les formats CSV,
            Excel et JSON sont acceptes. Les colonnes de localisation peuvent etre importees via
            les `*_id` ou les `*_name`.
          </div>
          <Button disabled={isPending} type="submit">
            {isPending ? "Import en cours..." : "Importer la fiche onboarding"}
          </Button>
        </form>
      </Card>

      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state.message ? <p className="text-sm text-emerald-700">{state.message}</p> : null}

      {state.summary ? (
        <Card className="space-y-2">
          <CardTitle>Resume</CardTitle>
          <CardDescription>
            {state.summary.processed} ligne(s) traitee(s), {state.summary.succeeded} reussite(s),{" "}
            {state.summary.errors} erreur(s).
          </CardDescription>
        </Card>
      ) : null}

      {state.report.length > 0 ? (
        <Card className="space-y-3">
          <CardTitle>Rapport d&apos;import</CardTitle>
          <div className="space-y-2 text-sm">
            {state.report.map((item) => (
              <div
                key={`${item.row}-${item.status}-${item.detail}`}
                className={
                  item.status === "success"
                    ? "rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-800"
                    : "rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-700"
                }
              >
                Ligne {item.row} : {item.detail}
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
