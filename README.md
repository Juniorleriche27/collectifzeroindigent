# CZI Web MVP

Frontend MVP de la plateforme CZI (membres + gouvernance) avec Next.js App Router et Supabase.

## Prerequis

- Node.js 20+
- npm 10+
- Projet Supabase configure

## Installation

```bash
npm install
cp .env.example .env.local
```

Renseigner ensuite les variables dans `.env.local` :

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Lancer le projet

```bash
npm run dev
```

## Routes MVP

- `/login`
- `/signup`
- `/onboarding`
- `/app/dashboard`
- `/app/members`
- `/app/members/[id]`
- `/app/profile`

## Etat actuel

- Auth Supabase branchee (signup/login/logout)
- Session guard via middleware + layouts server
- Ecrans MVP structures avec Tailwind + composants UI simples
- Onboarding obligatoire: creation `member` + update `profile.member_id`
- Membres: liste filtrable + detail editable relies a Supabase

## Verification RLS (compte standard)

Configurer ces variables dans votre shell:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `RLS_TEST_EMAIL`
- `RLS_TEST_PASSWORD`
- `RLS_FOREIGN_MEMBER_ID` (optionnel)

Puis lancer:

```bash
npm run verify:rls
```
