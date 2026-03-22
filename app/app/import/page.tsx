import { ImportClient } from "./import-client";

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">Import</p>
        <h2 className="mt-1 text-3xl font-semibold tracking-tight">
          Import des fiches onboarding
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Chargez un export onboarding CSV, Excel ou JSON pour mettre a jour les fiches membres deja
          visibles selon vos droits.
        </p>
      </div>

      <ImportClient />
    </div>
  );
}
