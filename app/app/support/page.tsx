import { MessageCircle } from "lucide-react";

export default function SupportPage() {
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
        <div className="relative z-10">
          <p className="text-[.65rem] font-bold uppercase tracking-[.14em] text-white/60 mb-[6px]">Mon espace</p>
          <h1 className="text-[1.6rem] font-bold leading-[1.15] text-white mb-[6px]" style={{ fontFamily: "'Syne', sans-serif" }}>
            Assistance
          </h1>
          <p className="text-[.85rem] text-white/65">Votre conseiller CZI disponible en bas à droite de l&apos;écran.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-white p-8 text-center" style={{ boxShadow: "0 1px 4px rgba(18,32,46,.06)" }}>
        <div
          className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ background: "linear-gradient(135deg, #1A8A9B, #0F5F6B)" }}
        >
          <MessageCircle size={28} className="text-white" />
        </div>
        <h2 className="mb-2 text-lg font-bold text-foreground" style={{ fontFamily: "'Syne', sans-serif" }}>
          Conseiller CZI
        </h2>
        <p className="mx-auto max-w-sm text-sm text-muted">
          Le conseiller CZI est accessible depuis le bouton flottant en bas à droite de toutes les pages.
          Cliquez dessus pour ouvrir la discussion.
        </p>
      </div>
    </div>
  );
}
