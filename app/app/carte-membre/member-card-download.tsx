"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { MemberCardMemberRecord, MemberCardRequestRecord } from "@/lib/supabase/member-card";

type Props = {
  member: MemberCardMemberRecord;
  request: MemberCardRequestRecord | null;
  cardTitle: string;
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "— / — / ——";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function expiryDate(iso: string | null | undefined): string {
  if (!iso) return "— / — / ——";
  const d = new Date(iso);
  d.setFullYear(d.getFullYear() + 3);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}


/** Format Togolese phone number — always prefix +228 */
function formatPhone(raw: string | null | undefined): string {
  if (!raw) return "";
  const cleaned = raw.trim().replace(/\s+/g, " ");
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.startsWith("228")) return `+${cleaned}`;
  return `+228 ${cleaned}`;
}

/** Build a consistent member reference from UUID: CZI-XXXXXXXX */
function buildMemberId(member: MemberCardMemberRecord, request: MemberCardRequestRecord | null): string {
  if (request?.card_number) return request.card_number;
  return `CZI-${member.id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

function cut(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}

export function MemberCardDownload({ member, request, cardTitle }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);

    try {
      // Fetch member photo and logo concurrently
      const [photoResult, logoResult] = await Promise.allSettled([
        member.photo_url
          ? fetch("/api/card/photo-proxy").then((r) => r.ok ? r.json() as Promise<{ base64?: string }> : null).catch(() => null)
          : Promise.resolve(null),
        fetch("/api/card/logo").then((r) => r.ok ? r.json() as Promise<{ base64?: string }> : null).catch(() => null),
      ]);

      const photoBase64: string | null =
        photoResult.status === "fulfilled" && photoResult.value
          ? (photoResult.value as { base64?: string }).base64 ?? null
          : null;

      const logoBase64: string | null =
        logoResult.status === "fulfilled" && logoResult.value
          ? (logoResult.value as { base64?: string }).base64 ?? null
          : null;

      // Load jsPDF dynamically
      const { jsPDF } = await import("jspdf");

      // Credit card: 85.6 × 54 mm
      const W = 85.6;
      const H = 54;

      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: [W, H] });

      // ── Palette ──────────────────────────────────────────
      const BLUE_D: [number, number, number] = [12, 55, 130];    // deep blue
      const BLUE_M: [number, number, number] = [24, 90, 180];    // mid blue
      const BLUE_L: [number, number, number] = [235, 241, 254];  // light blue bg
      const GOLD:  [number, number, number] = [204, 155, 40];    // gold accent
      const WHITE: [number, number, number] = [255, 255, 255];
      const DARK:  [number, number, number] = [18, 28, 50];      // near-black text
      const GRAY:  [number, number, number] = [110, 125, 150];   // muted text
      const LGRAY: [number, number, number] = [210, 218, 230];   // separator

      const memberId = buildMemberId(member, request);
      const lastName  = (member.last_name  ?? "").toUpperCase();
      const firstName = member.first_name  ?? "";
      const fullName  = [firstName, lastName].filter(Boolean).join(" ");
      const phone      = formatPhone(member.phone);
      const locality   = cut(member.locality ?? "", 28);
      const profession = cut(member.profession_title ?? "", 28);
      const role       = cut(cardTitle || "MEMBRE", 30);
      const delivDate = formatDate(request?.created_at);
      const expDate   = expiryDate(request?.created_at);

      // ══════════════════════ RECTO ════════════════════════

      // ── Background ──
      doc.setFillColor(...WHITE);
      doc.rect(0, 0, W, H, "F");

      // ── Header band (deep blue gradient effect via two rects) ──
      doc.setFillColor(...BLUE_D);
      doc.rect(0, 0, W, 14, "F");
      doc.setFillColor(...BLUE_M);
      doc.rect(0, 10, W, 4, "F");

      // ── Gold top accent line ──
      doc.setFillColor(...GOLD);
      doc.rect(0, 0, W, 0.8, "F");

      // ── Logo in header ──
      if (logoBase64) {
        try {
          doc.addImage(logoBase64, "JPEG", 2.5, 1.5, 10, 10);
        } catch {
          // fallback: draw a circle placeholder
          doc.setFillColor(...WHITE);
          doc.circle(7.5, 6.5, 4.5, "F");
          doc.setTextColor(...BLUE_D);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(5);
          doc.text("CZI", 5.8, 7.2);
        }
      } else {
        doc.setFillColor(...WHITE);
        doc.circle(7.5, 6.5, 4.5, "F");
        doc.setTextColor(...BLUE_D);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(5);
        doc.text("CZI", 5.8, 7.2);
      }

      // ── Header text ──
      doc.setTextColor(...WHITE);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text("COLLECTIF ZÉRO INDIGENT", 15, 6.2);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(5);
      doc.setTextColor(200, 215, 240);
      doc.text("CARTE DE MEMBRE OFFICIELLE", 15, 10.2);

      // ── Member ID chip (top right corner of header) ──
      doc.setFillColor(...GOLD);
      doc.roundedRect(58, 2.5, 25, 5.5, 0.8, 0.8, "F");
      doc.setTextColor(...WHITE);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(5.2);
      doc.text(memberId, 60.5, 6.2);

      // ── Light blue body background ──
      doc.setFillColor(...BLUE_L);
      doc.rect(0, 14, W, 33, "F");

      // ── Photo zone ── (left, 16–47 mm vertically, 2.5–24.5 mm horizontally)
      const photoX = 2.5;
      const photoY = 16.5;
      const photoW = 22;
      const photoH = 28;

      // Shadow/border effect
      doc.setFillColor(180, 195, 220);
      doc.roundedRect(photoX + 0.5, photoY + 0.5, photoW, photoH, 1, 1, "F");

      if (photoBase64) {
        try {
          doc.addImage(photoBase64, photoX, photoY, photoW, photoH);
        } catch {
          doc.setFillColor(...WHITE);
          doc.roundedRect(photoX, photoY, photoW, photoH, 1, 1, "F");
          doc.setTextColor(...GRAY);
          doc.setFont("helvetica", "italic");
          doc.setFontSize(5);
          doc.text("Photo", photoX + photoW / 2 - 2.5, photoY + photoH / 2);
        }
      } else {
        doc.setFillColor(...WHITE);
        doc.roundedRect(photoX, photoY, photoW, photoH, 1, 1, "F");
        doc.setTextColor(...GRAY);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(5);
        doc.text("Photo", photoX + photoW / 2 - 2.5, photoY + photoH / 2);
      }

      // Gold photo border top edge
      doc.setFillColor(...GOLD);
      doc.rect(photoX, photoY, photoW, 0.6, "F");

      // ── Member info block ──
      const ix = 28;  // info x start
      let iy = 19;

      // Full name (large)
      doc.setTextColor(...DARK);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text(cut(fullName || "—", 24), ix, iy);
      iy += 5;

      // Gold divider
      doc.setFillColor(...GOLD);
      doc.rect(ix, iy, 52, 0.5, "F");
      iy += 3;

      // Role badge text
      doc.setFont("helvetica", "bold");
      doc.setFontSize(5);
      doc.setTextColor(...BLUE_M);
      doc.text(role, ix, iy);
      iy += 5;

      // Info rows — toujours affichées, "—" si vide
      const rows: Array<[string, string]> = [
        ["Tél.",       phone      || "—"],
        ["Profession", profession || "—"],
        ["Adresse",    locality   || "—"],
      ];

      for (const [lbl, val] of rows) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(4.8);
        doc.setTextColor(...GRAY);
        doc.text(`${lbl}:`, ix, iy);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(...DARK);
        doc.text(cut(val, 26), ix + 12, iy);
        iy += 4.5;
      }

      // ── Decorative right-side accent bars ──
      doc.setFillColor(...GOLD);    doc.rect(82.8, 14, 1.2, 33, "F");
      doc.setFillColor(...BLUE_M);  doc.rect(81.2, 14, 1.2, 33, "F");
      doc.setFillColor(40, 130, 220); doc.rect(79.8, 14, 1.0, 33, "F");

      // ── Bottom band ──
      doc.setFillColor(...BLUE_D);
      doc.rect(0, 47, W, 7, "F");
      doc.setFillColor(...GOLD);
      doc.rect(0, 53.2, W, 0.8, "F");

      // Bottom text
      doc.setFont("helvetica", "normal");
      doc.setFontSize(4.2);
      doc.setTextColor(200, 215, 240);
      doc.text(`Délivré le : ${delivDate}`, 3, 50.5);
      doc.text(`Expire le : ${expDate}`, 33, 50.5);
      doc.text("Validité : 3 ans", 65, 50.5);

      // ══════════════════════ VERSO ════════════════════════
      doc.addPage([W, H], "landscape");

      // White background
      doc.setFillColor(...WHITE);
      doc.rect(0, 0, W, H, "F");

      // Subtle diagonal blue wash (simulate with two overlapping rects)
      doc.setFillColor(235, 241, 254);
      doc.rect(0, 0, W, H, "F");

      // Top strip
      doc.setFillColor(...BLUE_D);
      doc.rect(0, 0, W, 10, "F");
      doc.setFillColor(...GOLD);
      doc.rect(0, 0, W, 0.8, "F");
      doc.setFillColor(...GOLD);
      doc.rect(0, 9.2, W, 0.8, "F");

      // Logo on verso header
      if (logoBase64) {
        try {
          doc.addImage(logoBase64, "JPEG", 2.5, 0.8, 8.5, 8.5);
        } catch { /* skip */ }
      }

      // Header text on verso
      doc.setTextColor(...WHITE);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.text("COLLECTIF ZÉRO INDIGENT", 13.5, 5.5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(4.5);
      doc.setTextColor(200, 215, 240);
      doc.text("www.reseauczi.org", 13.5, 8.5);

      // Member ID chip on verso
      doc.setFillColor(...GOLD);
      doc.roundedRect(58, 2.5, 25, 5.5, 0.8, 0.8, "F");
      doc.setTextColor(...WHITE);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(5.2);
      doc.text(memberId, 60.5, 6.2);

      // ── Vision box ──
      doc.setFillColor(...BLUE_D);
      doc.roundedRect(3, 13, 55, 8, 0.8, 0.8, "F");
      doc.setTextColor(...GOLD);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(5.5);
      doc.text("VISION", 5, 17.5);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(5);
      doc.setTextColor(220, 230, 250);
      doc.text("Contribuer à l'éradication de l'extrême pauvreté", 18, 16.5);
      doc.text("et de la faim au Togo et en Afrique.", 18, 20);

      // ── Separator ──
      doc.setFillColor(...LGRAY);
      doc.rect(3, 23.5, 60, 0.4, "F");

      // ── Contact block ──
      const crows: Array<[string, string]> = [
        ["Tél.", "+228 79 07 07 16 / 71 15 46 46"],
        ["Email", "czi.infos@gmail.com"],
        ["Web", "reseauczi.org"],
      ];

      let cy = 27.5;
      for (const [lbl, val] of crows) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(4.8);
        doc.setTextColor(...BLUE_D);
        doc.text(`${lbl} :`, 4, cy);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(...DARK);
        doc.text(val, 18, cy);
        cy += 5;
      }

      // ── Official stamp (right side) ──
      const sx = 72;
      const sy = 30;

      doc.setDrawColor(...BLUE_D);
      doc.setLineWidth(0.9);
      doc.circle(sx, sy, 13);
      doc.setLineWidth(0.4);
      doc.circle(sx, sy, 11.2);

      doc.setFillColor(...BLUE_D);
      doc.circle(sx, sy, 0.8, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(4.2);
      doc.setTextColor(...BLUE_D);

      // Curved text simulation via character spacing
      doc.text("COLLECTIF ZÉRO INDIGENT", sx - 9.8, sy - 6.5);
      doc.setFillColor(...GOLD);
      doc.rect(sx - 8, sy - 4.5, 16, 0.4, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(5.5);
      doc.setTextColor(...BLUE_D);
      doc.text("C . Z . I .", sx - 4.5, sy + 1);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(4);
      doc.text("OFFICIAL STAMP", sx - 5.8, sy + 5.5);
      doc.setFillColor(...GOLD);
      doc.rect(sx - 8, sy + 6.5, 16, 0.4, "F");
      doc.setFont("helvetica", "italic");
      doc.setFontSize(3.8);
      doc.text("Togo · Afrique", sx - 4.5, sy + 9);

      // ── Bottom strip ──
      doc.setFillColor(...BLUE_D);
      doc.rect(0, 47, W, 7, "F");
      doc.setFillColor(...GOLD);
      doc.rect(0, 53.2, W, 0.8, "F");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(4.2);
      doc.setTextColor(200, 215, 240);
      doc.text("Cette carte est la propriété du Collectif Zéro Indigent. En cas de perte, contacter le CZI.", 3, 50.5);

      // ── Save ──
      const namePart = [member.first_name, member.last_name]
        .filter(Boolean)
        .join("_")
        .replace(/\s+/g, "_") || "membre";
      doc.save(`carte_czi_${namePart}.pdf`);
    } catch (err) {
      console.error("Card generation error:", err);
      setError(err instanceof Error ? err.message : "Erreur lors de la génération.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button className="w-full gap-2" disabled={loading} onClick={generate} size="lg" type="button">
        {loading ? (
          <>
            <Loader2 className="animate-spin" size={18} />
            Génération en cours…
          </>
        ) : (
          <>
            <Download size={18} />
            Télécharger ma carte (PDF)
          </>
        )}
      </Button>
      {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
