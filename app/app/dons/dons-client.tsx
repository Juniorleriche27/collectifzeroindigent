"use client";

import { useActionState } from "react";
import { HeartHandshake } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { DonationItem, DonationStatus, DonationSummary } from "@/lib/backend/api";

import {
  createDonationAction,
  startDonationPaydunyaCheckoutAction,
  updateDonationStatusAction,
  type DonationCheckoutActionState,
  type DonationActionState,
} from "./actions";
import {
  donationManualTransfers,
  donationPaymentMode,
  formatDonationPaymentProvider,
} from "./payment-config";

type DonsClientProps = {
  canManage: boolean;
  initialQuery: string;
  initialStatus: DonationStatus | "all";
  items: DonationItem[];
  loadError: string | null;
  paymentError: string | null;
  paymentInfo: string | null;
  role: string | null;
  summary: DonationSummary;
};

function formatAmount(value: number): string {
  return new Intl.NumberFormat("fr-FR").format(value);
}

function statusVariant(status: DonationStatus): "default" | "success" | "warning" | "danger" {
  if (status === "paid") return "success";
  if (status === "pending" || status === "pledged") return "warning";
  if (status === "failed" || status === "cancelled") return "danger";
  return "default";
}

export function DonsClient({
  canManage,
  initialQuery,
  initialStatus,
  items,
  loadError,
  paymentError,
  paymentInfo,
  role,
  summary,
}: DonsClientProps) {
  const initialState: DonationActionState = { error: null, success: null };
  const initialCheckoutState: DonationCheckoutActionState = {
    error: null,
    success: null,
  };
  const [createState, createAction, createPending] = useActionState(
    createDonationAction,
    initialState,
  );
  const [checkoutState, checkoutAction, checkoutPending] = useActionState(
    startDonationPaydunyaCheckoutAction,
    initialCheckoutState,
  );
  const [updateState, updateAction, updatePending] = useActionState(
    updateDonationStatusAction,
    initialState,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Dons</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">Faire un don</h2>
          <CardDescription className="mt-2">
            Soutenez les actions CZI. Le montant est en CFA (XOF).
          </CardDescription>
        </div>
      </div>

      {role ? (
        <Card>
          <CardDescription>
            Role actif: <span className="font-semibold text-foreground">{role}</span>
          </CardDescription>
        </Card>
      ) : null}

      {loadError ? (
        <Card>
          <CardDescription className="text-red-600">{loadError}</CardDescription>
        </Card>
      ) : null}
      {paymentError ? (
        <Card>
          <CardDescription className="text-red-600">{paymentError}</CardDescription>
        </Card>
      ) : null}
      {paymentInfo ? (
        <Card>
          <CardDescription className="text-emerald-700">{paymentInfo}</CardDescription>
        </Card>
      ) : null}
      {donationPaymentMode === "manual" ? (
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-surface to-secondary/10">
          <div className="grid gap-4 md:grid-cols-[1.3fr_1fr_1fr]">
            <div className="space-y-2">
              <CardTitle className="text-base">Paiement temporaire par mobile money</CardTitle>
              <CardDescription className="text-sm leading-6 text-foreground/80">
                En attendant la validation KYC PayDunya en production, les dons sont enregistres
                puis verifies manuellement par CZI. Apres le transfert, conservez votre reference
                ou votre capture de paiement.
              </CardDescription>
            </div>
            {donationManualTransfers.map((transfer) => (
              <div
                className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur"
                key={transfer.code}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                  {transfer.label}
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
                  {transfer.number}
                </p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {createState.error ? (
        <Card>
          <CardDescription className="text-red-600">{createState.error}</CardDescription>
        </Card>
      ) : null}
      {createState.success ? (
        <Card>
          <CardDescription className="text-emerald-700">{createState.success}</CardDescription>
        </Card>
      ) : null}
      {updateState.error ? (
        <Card>
          <CardDescription className="text-red-600">{updateState.error}</CardDescription>
        </Card>
      ) : null}
      {updateState.success ? (
        <Card>
          <CardDescription className="text-emerald-700">{updateState.success}</CardDescription>
        </Card>
      ) : null}
      {checkoutState.error ? (
        <Card>
          <CardDescription className="text-red-600">{checkoutState.error}</CardDescription>
        </Card>
      ) : null}
      {checkoutState.success ? (
        <Card>
          <CardDescription className="text-emerald-700">{checkoutState.success}</CardDescription>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardDescription>Total dons</CardDescription>
          <CardTitle className="mt-2 text-2xl">{summary.count}</CardTitle>
        </Card>
        <Card>
          <CardDescription>Montant cumule</CardDescription>
          <CardTitle className="mt-2 text-2xl">{formatAmount(summary.total_amount_cfa)} F</CardTitle>
        </Card>
        <Card>
          <CardDescription>Montant paye</CardDescription>
          <CardTitle className="mt-2 text-2xl">{formatAmount(summary.paid_amount_cfa)} F</CardTitle>
        </Card>
        <Card>
          <CardDescription>Dons en attente</CardDescription>
          <CardTitle className="mt-2 text-2xl">{summary.pending_count}</CardTitle>
        </Card>
      </div>

      <Card className="space-y-4">
        <CardTitle className="text-base">Nouveau don</CardTitle>
        <form action={createAction} className="grid gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="donation-amount">
              Montant (CFA)
            </label>
            <Input id="donation-amount" min={100} name="amount_cfa" placeholder="5000" required type="number" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="donation-message">
              Message (optionnel)
            </label>
            <textarea
              className="min-h-[90px] w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/20"
              id="donation-message"
              name="message"
              placeholder="Votre message..."
            />
          </div>
          <div>
            <Button disabled={createPending} type="submit">
              {createPending
                ? donationPaymentMode === "manual"
                  ? "Enregistrement..."
                  : "Redirection..."
                : donationPaymentMode === "manual"
                  ? "Enregistrer le don"
                  : "Continuer"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="space-y-3">
        <CardTitle className="text-base">Recherche</CardTitle>
        <form className="flex flex-wrap items-center gap-3" method="get">
          <Input
            className="min-w-[260px] flex-1"
            defaultValue={initialQuery}
            name="q"
            placeholder="Message, reference paiement..."
          />
          <Select defaultValue={initialStatus} name="status">
            <option value="all">Tous les statuts</option>
            <option value="pledged">pledged</option>
            <option value="pending">pending</option>
            <option value="paid">paid</option>
            <option value="failed">failed</option>
            <option value="cancelled">cancelled</option>
            <option value="refunded">refunded</option>
          </Select>
          <Button type="submit" variant="secondary">
            Filtrer
          </Button>
        </form>
      </Card>

      {items.length === 0 ? (
        <Card className="flex min-h-[220px] flex-col items-center justify-center text-center">
          <div className="rounded-full bg-muted-surface p-4 text-muted">
            <HeartHandshake size={30} />
          </div>
          <CardTitle className="mt-4">Aucun don</CardTitle>
          <CardDescription className="mt-2">
            Lancez le premier don depuis le formulaire ci-dessus.
          </CardDescription>
        </Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[1020px] text-left">
            <thead className="bg-muted-surface">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
                  Date
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
                  Montant
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
                  Statut
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
                  Paiement
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
                  Message
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr className="border-t border-border" key={item.id}>
                  <td className="px-4 py-3 text-sm text-muted">
                    {new Date(item.created_at).toLocaleString("fr-FR")}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold">{formatAmount(item.amount_cfa)} F</td>
                  <td className="px-4 py-3 text-sm">
                    <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted">
                    {formatDonationPaymentProvider(item.payment_provider)}
                    <br />
                    {item.payment_ref ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted">{item.message ?? "-"}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      {canManage && (item.status === "pending" || item.status === "pledged") ? (
                        <>
                          {donationPaymentMode === "paydunya" ? (
                            <form action={checkoutAction}>
                              <input name="donation_id" type="hidden" value={item.id} />
                              <Button disabled={checkoutPending} size="sm" type="submit" variant="secondary">
                                {checkoutPending ? "Redirection..." : "Payer maintenant"}
                              </Button>
                            </form>
                          ) : null}
                          <form action={updateAction}>
                            <input name="donation_id" type="hidden" value={item.id} />
                            <input name="status" type="hidden" value="paid" />
                            <Button disabled={updatePending} size="sm" type="submit">
                              Marquer paye
                            </Button>
                          </form>
                          <form action={updateAction}>
                            <input name="donation_id" type="hidden" value={item.id} />
                            <input name="status" type="hidden" value="failed" />
                            <Button disabled={updatePending} size="sm" type="submit" variant="secondary">
                              Marquer echec
                            </Button>
                          </form>
                        </>
                      ) : null}
                      {canManage && item.status === "paid" ? (
                        <form action={updateAction}>
                          <input name="donation_id" type="hidden" value={item.id} />
                          <input name="status" type="hidden" value="refunded" />
                          <Button disabled={updatePending} size="sm" type="submit" variant="secondary">
                            Rembourser
                          </Button>
                        </form>
                      ) : null}
                      {!canManage && (item.status === "pending" || item.status === "pledged") ? (
                        <>
                          {donationPaymentMode === "paydunya" ? (
                            <form action={checkoutAction}>
                              <input name="donation_id" type="hidden" value={item.id} />
                              <Button disabled={checkoutPending} size="sm" type="submit" variant="secondary">
                                {checkoutPending ? "Redirection..." : "Payer maintenant"}
                              </Button>
                            </form>
                          ) : null}
                          <form action={updateAction}>
                            <input name="donation_id" type="hidden" value={item.id} />
                            <input name="status" type="hidden" value="cancelled" />
                            <Button disabled={updatePending} size="sm" type="submit" variant="ghost">
                              Annuler
                            </Button>
                          </form>
                        </>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
