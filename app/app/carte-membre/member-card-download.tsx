"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { MemberCardMemberRecord, MemberCardRequestRecord } from "@/lib/supabase/member-card";

type Props = {
  member: MemberCardMemberRecord;
  request: MemberCardRequestRecord | null;
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "00/00/0000";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function expiryDate(iso: string | null | undefined): string {
  if (!iso) return "00/00/0000";
  const d = new Date(iso);
  d.setFullYear(d.getFullYear() + 3);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function statusLabel(member: MemberCardMemberRecord): string {
  if (member.profession_title) return member.profession_title;
  if (member.join_mode === "entrepreneur") return "Entrepreneur";
  if (member.join_mode === "org_leader") return "Leader Associatif";
  if (member.join_mode === "engaged") return "Citoyen Engagé";
  return "Membre CZI";
}

function cut(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}

export function MemberCardDownload({ member, request }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);

    try {
      // Fetch member photo as base64 via the proxy
      let photoBase64: string | null = null;
      if (member.photo_url) {
        try {
          const res = await fetch("/api/card/photo-proxy");
          if (res.ok) {
            const data = await res.json() as { base64?: string };
            photoBase64 = data.base64 ?? null;
          }
        } catch {
          /* continue without photo */
        }
      }

      // Load jsPDF dynamically to avoid SSR issues
      const { jsPDF } = await import("jspdf");

      // Credit card dimensions: 85.6 × 54 mm
      const W = 85.6;
      const H = 54;

      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: [W, H] });

      // ── Palette ──────────────────────────────────────────────
      const B: [number, number, number] = [30, 79, 174];      // CZI blue
      const LB: [number, number, number] = [214, 228, 247];   // light blue
      const M: [number, number, number] = [213, 0, 94];       // magenta
      const Y: [number, number, number] = [247, 181, 0];      // yellow
      const C: [number, number, number] = [0, 186, 220];      // cyan
      const D: [number, number, number] = [30, 40, 70];       // dark text
      const MG: [number, number, number] = [100, 115, 140];   // mid gray
      const SB: [number, number, number] = [227, 233, 243];   // strip bg

      // ══════════════════════ RECTO ════════════════════════════

      // White background
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, W, H, "F");

      // Blue header (0–13 mm)
      doc.setFillColor(...B);
      doc.rect(0, 0, W, 13, "F");

      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text("Collectif Zéro Indigent", 5, 6.5);

      // Subtitle
      doc.setFont("helvetica", "normal");
      doc.setFontSize(5.5);
      doc.text("Carte de membre", 5, 11);

      // Logo — 3 overlapping circles (cyan, magenta, yellow)
      doc.setFillColor(...C);
      doc.circle(74, 4.5, 2.8, "F");
      doc.setFillColor(...M);
      doc.circle(77.5, 7.2, 2.8, "F");
      doc.setFillColor(...Y);
      doc.circle(71, 7.8, 2.8, "F");

      // ID bar (13–20.5 mm)
      doc.setFillColor(...LB);
      doc.rect(0, 13, W, 7.5, "F");

      const cardNum = request?.card_number ?? "CZI-EN-COURS";
      doc.setTextColor(...B);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text(`ID: ${cardNum}`, 5, 18.5);

      // Decorative vertical bars on right edge
      doc.setFillColor(...M);  doc.rect(79, 20.5, 1.8, 26, "F");
      doc.setFillColor(...Y);  doc.rect(81.4, 20.5, 1.2, 26, "F");
      doc.setFillColor(...B);  doc.rect(83.2, 20.5, 1.2, 26, "F");
      doc.setFillColor(...C);  doc.rect(84.8, 20.5, 0.8, 26, "F");

      // Photo frame
      doc.setDrawColor(...B);
      doc.setLineWidth(0.5);
      doc.rect(3, 21.5, 22, 25);

      if (photoBase64) {
        try {
          doc.addImage(photoBase64, 3, 21.5, 22, 25);
        } catch {
          doc.setFillColor(220, 225, 235);
          doc.rect(3, 21.5, 22, 25, "F");
          doc.setTextColor(...MG);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(5);
          doc.text("Photo", 12, 34.5);
        }
      } else {
        doc.setFillColor(220, 225, 235);
        doc.rect(3, 21.5, 22, 25, "F");
        doc.setTextColor(...MG);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(5);
        doc.text("Photo", 12, 34.5);
      }

      // Member info rows
      const infoX = 29;
      const labelW = 19;
      const valX = infoX + labelW;
      const lineH = 4.8;
      let iy = 25;

      const fields: [string, string][] = [
        ["Nom", cut((member.last_name ?? "-").toUpperCase(), 20)],
        ["Prénoms", cut(member.first_name ?? "-", 22)],
        ["N° de tél", member.phone ?? "-"],
        ["Localité", cut(member.locality ?? "-", 22)],
      ];

      for (const [lbl, val] of fields) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(5.2);
        doc.setTextColor(...B);
        doc.text(`${lbl}  :`, infoX, iy);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(5.2);
        doc.setTextColor(...D);
        doc.text(val, valX, iy);

        iy += lineH;
      }

      // Statut
      doc.setFont("helvetica", "bold");
      doc.setFontSize(5.2);
      doc.setTextColor(...B);
      doc.text("Statut:", infoX, iy + 1);
      iy += 4.5;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(5.8);
      doc.setTextColor(...M);
      doc.text(cut(statusLabel(member), 28), infoX, iy);

      // Bottom strip (47–54 mm)
      doc.setFillColor(...SB);
      doc.rect(0, 47, W, 7, "F");

      // Colored lines at the very bottom
      doc.setFillColor(...M);
      doc.rect(0, 52.5, 42, 1.5, "F");
      doc.setFillColor(...Y);
      doc.rect(43, 52.5, 42.6, 1.5, "F");

      const delivDate = formatDate(request?.created_at);
      const expDate = expiryDate(request?.created_at);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(4.5);
      doc.setTextColor(...MG);
      doc.text(`Date de délivrance : ${delivDate}`, 3, 50.8);
      doc.text(`Date d'expiration : ${expDate}`, 33, 50.8);
      doc.text("Validité : 3 ans", 70, 50.8);

      // ══════════════════════ VERSO ════════════════════════════
      doc.addPage([W, H], "landscape");

      // Background
      doc.setFillColor(219, 228, 242);
      doc.rect(0, 0, W, H, "F");

      // Top blue band
      doc.setFillColor(...B);
      doc.rect(0, 0, W, 7, "F");
      doc.setFillColor(...M);
      doc.rect(0, 7, W, 2, "F");
      doc.setFillColor(...Y);
      doc.rect(0, 9, W, 1.5, "F");

      // Vision label box
      doc.setFillColor(...B);
      doc.rect(4, 14, 20, 6, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text("Vision:", 5.5, 18.5);

      // Vision text
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(...D);
      const vText = "Contribuer à l'éradication de l'extrême pauvreté et la faim";
      doc.text(doc.splitTextToSize(vText, 58), 4, 28);

      // Divider
      doc.setDrawColor(160, 180, 210);
      doc.setLineWidth(0.3);
      doc.line(4, 35, 65, 35);

      // Contact info
      const contactY = (y: number) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(5.5);
        doc.setTextColor(...B);
        return y;
      };

      let cy = contactY(39.5);
      doc.text("Contacts :", 4, cy);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...D);
      doc.text("+228 79070716 / 71154646", 27, cy);

      cy = contactY(44.5);
      doc.text("Email :", 4, cy);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...D);
      doc.text("czi.infos@gmail.com", 27, cy);

      cy = contactY(49.5);
      doc.text("Site web :", 4, cy);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...D);
      doc.text("reseauczi.org", 27, cy);

      // Stamp
      doc.setDrawColor(...B);
      doc.setLineWidth(0.7);
      doc.circle(72, 37, 12);
      doc.setLineWidth(0.3);
      doc.circle(72, 37, 10.5);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(4.5);
      doc.setTextColor(...B);
      doc.text("COLLECTIF", 68.8, 32.5);
      doc.text("ZÉRO INDIGENT", 67, 37.5);
      doc.text("C.Z.I.", 70.5, 42.5);

      // Bottom strips on verso
      doc.setFillColor(...M);
      doc.rect(0, 50.5, 42, 2, "F");
      doc.setFillColor(...Y);
      doc.rect(43.5, 50.5, 42.1, 2, "F");

      // ── Save ─────────────────────────────────────────────────
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
      <Button className="w-full gap-2" disabled={loading} onClick={generate} type="button">
        {loading ? (
          <>
            <Loader2 className="animate-spin" size={16} />
            Génération en cours…
          </>
        ) : (
          <>
            <Download size={16} />
            Télécharger ma carte (PDF)
          </>
        )}
      </Button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
