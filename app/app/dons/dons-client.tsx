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

function formatDonationStatusLabel(status: DonationStatus): string {
  if (status === "pledged") return "Enregistré";
  if (status === "pending") return "En attente";
  if (status === "paid") return "Payé";
  if (status === "failed") return "Échec";
  if (status === "cancelled") return "Annulé";
  if (status === "refunded") return "Remboursé";
  return status;
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
      {/* Header banner */}
      <div
        className="relative overflow-hidden rounded-2xl px-8 py-7 text-white shadow-md"
        style={{ background: "linear-gradient(120deg, #0F5F6B 0%, #1A8A9B 60%, #25B4C8 100%)" }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: "repeating-linear-gradient(45deg, rgba(255,255,255,.03) 0, rgba(255,255,255,.03) 1px, transparent 0, transparent 24px)",
          }}
        />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[.65rem] font-bold uppercase tracking-[.14em] text-white/60 mb-[6px]">Mon espace</p>
            <h1 className="text-[1.6rem] font-bold leading-[1.15] text-white mb-[6px]" style={{ fontFamily: "'Syne', sans-serif" }}>
              Faire un don
            </h1>
            <p className="text-[.85rem] text-white/65">Soutenez les actions CZI. Montant en CFA (XOF).</p>
          </div>
          {role ? (
            <span className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold">
              Rôle : {role}
            </span>
          ) : null}
        </div>
      </div>

      {loadError ? (
        <Card className="border-red-200 bg-red-50">
          <CardDescription className="text-red-700">{loadError}</CardDescription>
        </Card>
      ) : null}
      {paymentError ? (
        <Card className="border-red-200 bg-red-50">
          <CardDescription className="text-red-700">{paymentError}</CardDescription>
        </Card>
      ) : null}
      {paymentInfo ? (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardDescription className="text-emerald-700">{paymentInfo}</CardDescription>
        </Card>
      ) : null}
      {donationPaymentMode === "manual" ? (
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-surface to-secondary/10">
          <div className="grid gap-4 md:grid-cols-[1.3fr_1fr_1fr]">
            <div className="space-y-2">
              <CardTitle className="text-base">Paiement temporaire par mobile money</CardTitle>
              <CardDescription className="text-sm leading-6 text-foreground/80">
                Les dons sont actuellement enregistrés puis vérifiés manuellement par CZI. Apres le
                transfert, conservez votre reference ou votre capture de paiement.
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
        <Card className="border-red-200 bg-red-50"><CardDescription className="text-red-700">{createState.error}</CardDescription></Card>
      ) : null}
      {createState.success ? (
        <Card className="border-emerald-200 bg-emerald-50"><CardDescription className="text-emerald-700">{createState.success}</CardDescription></Card>
      ) : null}
      {updateState.error ? (
        <Card className="border-red-200 bg-red-50"><CardDescription className="text-red-700">{updateState.error}</CardDescription></Card>
      ) : null}
      {updateState.success ? (
        <Card className="border-emerald-200 bg-emerald-50"><CardDescription className="text-emerald-700">{updateState.success}</CardDescription></Card>
      ) : null}
      {checkoutState.error ? (
        <Card className="border-red-200 bg-red-50"><CardDescription className="text-red-700">{checkoutState.error}</CardDescription></Card>
      ) : null}
      {checkoutState.success ? (
        <Card className="border-emerald-200 bg-emerald-50"><CardDescription className="text-emerald-700">{checkoutState.success}</CardDescription></Card>
      ) : null}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Total dons",     value: String(summary.count),                            bar: "#1E88E5", text: "#1E88E5", bg: "rgba(30,136,229,.1)" },
          { label: "Montant cumulé", value: `${formatAmount(summary.total_amount_cfa)} F`,    bar: "#1A8A9B", text: "#1A8A9B", bg: "rgba(26,138,155,.1)" },
          { label: "Montant payé",   value: `${formatAmount(summary.paid_amount_cfa)} F`,     bar: "#43A047", text: "#43A047", bg: "rgba(67,160,71,.1)" },
          { label: "En attente",     value: String(summary.pending_count),                    bar: "#F9A825", text: "#F9A825", bg: "rgba(249,168,37,.1)" },
        ].map(({ label, value, bar, text }) => (
          <div
            key={label}
            className="relative overflow-hidden rounded-[14px] border border-[#E2E8F0] bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            style={{ boxShadow: "0 1px 4px rgba(18,32,46,.06)" }}
          >
            <div style={{ height: 3, background: bar, borderRadius: "14px 14px 0 0" }} />
            <div className="p-5">
              <p className="text-[.65rem] font-bold uppercase tracking-[.12em] text-[#7A8CA0] mb-3">{label}</p>
              <p className="text-[2rem] font-bold leading-none" style={{ color: text }}>{value}</p>
            </div>
          </div>
        ))}
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
                  ? "Enregistrément..."
                  : "Redirection..."
                : donationPaymentMode === "manual"
                  ? "Enregistrér le don"
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
            placeholder="Message, référence paiement..."
          />
          <Select defaultValue={initialStatus} name="status">
            <option value="all">Tous les statuts</option>
            <option value="pledged">Enregistré</option>
            <option value="pending">En attente</option>
            <option value="paid">Payé</option>
            <option value="failed">Échec</option>
            <option value="cancelled">Annulé</option>
            <option value="refunded">Remboursé</option>
          </Select>
          <Button type="submit" variant="secondary">
            Filtrer
          </Button>
        </form>
      </Card>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted-surface/30 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50">
            <HeartHandshake className="text-rose-500" size={32} />
          </div>
          <h3 className="mt-4 text-base font-semibold">Aucun don enregistré</h3>
          <p className="mt-1 text-sm text-muted">Lancez le premier don depuis le formulaire ci-dessus.</p>
        </div>
      ) : (
        <Card className="overflow-hidden p-0">
          <p className="px-4 pt-3 text-xs text-muted md:hidden">← Faites défiler le tableau horizontalement →</p>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[1020px] text-left">
            <thead>
              <tr className="border-b border-border bg-muted-surface/60">
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-muted">Date</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-muted">Montant</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-muted">Statut</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-muted">Paiement</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-muted">Message</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr className="border-t border-border transition-colors hover:bg-muted-surface/40" key={item.id}>
                  <td className="px-4 py-3 text-sm text-muted">
                    {new Date(item.created_at).toLocaleString("fr-FR")}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold">{formatAmount(item.amount_cfa)} F</td>
                  <td className="px-4 py-3 text-sm">
                    <Badge variant={statusVariant(item.status)}>{formatDonationStatusLabel(item.status)}</Badge>
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
                                {checkoutPending ? "Redirection..." : "Payér maintenant"}
                              </Button>
                            </form>
                          ) : null}
                          <form action={updateAction}>
                            <input name="donation_id" type="hidden" value={item.id} />
                            <input name="status" type="hidden" value="paid" />
                            <Button disabled={updatePending} size="sm" type="submit">
                              Marquer payé
                            </Button>
                          </form>
                          <form action={updateAction}>
                            <input name="donation_id" type="hidden" value={item.id} />
                            <input name="status" type="hidden" value="failed" />
                            <Button disabled={updatePending} size="sm" type="submit" variant="secondary">
                              Marquer Échec
                            </Button>
                          </form>
                        </>
                      ) : null}
                      {canManage && item.status === "paid" ? (
                        <form action={updateAction}>
                          <input name="donation_id" type="hidden" value={item.id} />
                          <input name="status" type="hidden" value="refunded" />
                          <Button disabled={updatePending} size="sm" type="submit" variant="secondary">
                            Remboursér
                          </Button>
                        </form>
                      ) : null}
                      {!canManage && (item.status === "pending" || item.status === "pledged") ? (
                        <>
                          {donationPaymentMode === "paydunya" ? (
                            <form action={checkoutAction}>
                              <input name="donation_id" type="hidden" value={item.id} />
                              <Button disabled={checkoutPending} size="sm" type="submit" variant="secondary">
                                {checkoutPending ? "Redirection..." : "Payér maintenant"}
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
          </div>
        </Card>
      )}
    </div>
  );
}
