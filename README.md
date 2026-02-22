# CZI Web MVP

MVP CZI (membres + gouvernance) avec frontend Next.js App Router, backend REST NestJS et Supabase.

## Prerequis

- Node.js 20+
- npm 10+
- Projet Supabase configure

## Installation

```bash
npm install
cd backend && npm install && cd ..
cp .env.example .env.local
```

Renseigner ensuite les variables dans `.env.local` :

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_BACKEND_URL` (ex: `http://127.0.0.1:4000`)

## Lancer le projet

Terminal 1 (backend REST):

```bash
cd backend
npm run start:dev
```

Terminal 2 (frontend Next.js):

```bash
npm run dev
```

## Routes MVP

- `/login`
- `/signup`
- `/onboarding`
- `/app/dashboard`
- `/app/membres`
- `/app/membres/[id]`
- `/app/organisations`
- `/app/parametres`
- `/app/profils`
- `/app/support`
- `/app/import`
- `/app/export`

## Etat actuel

- Auth Supabase branchee (signup/login/logout)
- Session guard via middleware + layouts server
- Ecrans MVP structures avec Tailwind + composants UI simples (style Figma)
- API backend REST active (`/api/health`, `/api/locations`, `/api/members`, `/api/onboarding`, `/api/organisations`)
- Onboarding obligatoire: creation `member` + update `profile.member_id` via API backend
- Membres/Organisations/Parametres relies au backend REST (RLS via token utilisateur)
- Layout app: sidebar + topbar + nouvelles routes FR

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

## Activation organisations (production)

Si la page `/app/organisations` affiche "Aucune table organisation detectee", executez ce script dans Supabase SQL Editor:

- `sql/2026-02-21_create_organisation_table.sql`

Ensuite rechargez la page: la creation d'organisation sera active.

## Liaison membres -> organisations (phase 2)

Pour activer le rattachement d'un membre a une organisation (`member.organisation_id`), executez aussi:

- `sql/2026-02-21_link_member_organisation.sql`

## RLS par role (phase 2)

Si `public.profile.role` est de type enum et refuse `pf/cn/ca/admin`, executez d'abord:

- `sql/2026-02-22_extend_profile_role_enum.sql`

Pour appliquer les droits metier sur `member` selon `profile.role` (`member`, `pf`, `cn`, `ca`, `admin`), executez:

- `sql/2026-02-21_role_based_member_access.sql`

Effet attendu:

- `member`: acces a ses propres enregistrements
- `pf`: acces en lecture sur toutes les regions (filtre par region recommande), edition limitee a sa region
- `cn`/`ca`/`admin`: acces elargi
