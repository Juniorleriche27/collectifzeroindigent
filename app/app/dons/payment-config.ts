export type DonationPaymentMode = "manual" | "paydunya";

export const donationPaymentMode: DonationPaymentMode =
  process.env.NEXT_PUBLIC_DONATION_PAYMENT_MODE?.toLowerCase() === "paydunya"
    ? "paydunya"
    : "manual";

export const donationManualTransfers = [
  {
    code: "yas",
    label: "Mixx by Yas / Tape Tap Send",
    number: "71154646",
  },
  {
    code: "moov",
    label: "Flooz / Moov Money",
    number: "79070716",
  },
] as const;

export function formatDonationPaymentProvider(value: string | null | undefined): string {
  if (!value) {
    return "-";
  }
  if (value === "manual_mobile_money") {
    return "Validation manuelle";
  }
  if (value === "paydunya") {
    return "Paiement en ligne";
  }
  return value;
}

export function getDonationManualPaymentMessage(amountCfa: number): string {
  const formattedAmount = new Intl.NumberFormat("fr-FR").format(amountCfa);
  return [
    `Don enregistre pour ${formattedAmount} F.`,
    `Envoyez le montant au ${donationManualTransfers[0].number} (${donationManualTransfers[0].label}) ou au ${donationManualTransfers[1].number} (${donationManualTransfers[1].label}).`,
    "Conservez la reference ou la capture du transfert puis transmettez-la a un responsable CZI pour validation manuelle.",
  ].join(" ");
}
