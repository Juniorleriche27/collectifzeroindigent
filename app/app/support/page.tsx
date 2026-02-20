import { LifeBuoy } from "lucide-react";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default function SupportPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">Support</p>
        <h2 className="mt-1 text-3xl font-semibold tracking-tight">Centre d&apos;aide</h2>
      </div>
      <Card className="flex min-h-[320px] flex-col items-center justify-center text-center">
        <div className="rounded-full bg-muted-surface p-4 text-muted">
          <LifeBuoy size={36} />
        </div>
        <CardTitle className="mt-6">Support</CardTitle>
        <CardDescription className="mt-3 max-w-md">
          Centre d&apos;aide et support - en cours de developpement.
        </CardDescription>
      </Card>
    </div>
  );
}
