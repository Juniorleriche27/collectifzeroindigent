"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

import {
  requestMemberOnboardingAnalysis,
  type MemberOnboardingAnalysisState,
} from "./actions";

const initialState: MemberOnboardingAnalysisState = {
  analysis: null,
  error: null,
  generatedAt: null,
  model: null,
};

export function MemberOnboardingAnalysisCard({ memberId }: { memberId: string }) {
  const action = requestMemberOnboardingAnalysis.bind(null, memberId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <Card className="space-y-4">
      <div className="space-y-1">
        <CardTitle>Analyse IA de la fiche onboarding</CardTitle>
        <CardDescription>
          Interpretation reservee aux roles admin, CA et CN. Generation a la demande.
        </CardDescription>
      </div>

      <form action={formAction}>
        <Button type="submit" variant="secondary" disabled={isPending}>
          {isPending ? "Generation..." : "Generer l'analyse IA"}
        </Button>
      </form>

      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

      {state.analysis ? (
        <div className="space-y-2 rounded-lg border border-border bg-muted-surface/50 p-4">
          <p className="text-sm leading-7 text-foreground">{state.analysis}</p>
          <p className="text-xs text-muted">
            {state.generatedAt ? `Generee le ${new Date(state.generatedAt).toLocaleString()}` : null}
            {state.model ? ` | Modele: ${state.model}` : null}
          </p>
        </div>
      ) : null}
    </Card>
  );
}
