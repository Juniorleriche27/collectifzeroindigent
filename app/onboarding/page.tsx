import { OnboardingForm } from "./onboarding-form";

export const dynamic = "force-dynamic";

export default function OnboardingPage() {
  return (
    <main className="min-h-screen px-4 py-10 pb-24" style={{ background: "#0D1829" }}>
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <p
            className="mb-2 text-[0.65rem] font-bold uppercase tracking-[.16em]"
            style={{ color: "#1A8A9B", fontFamily: "'Syne', sans-serif" }}
          >
            Étape obligatoire
          </p>
          <h1
            className="text-2xl font-bold text-white sm:text-3xl"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Finalisation de la fiche membre
          </h1>
          <p className="mt-2 text-sm text-white/45">
            Identité, localisation, orientation CZI et besoins.
          </p>
        </div>
        <OnboardingForm />
      </div>
    </main>
  );
}
