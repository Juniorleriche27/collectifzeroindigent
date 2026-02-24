# CZI Backend (NestJS REST)

Backend REST officiel du projet CZI.

## Stack

- NestJS 11
- Supabase (Postgres + Auth JWT)
- TypeScript strict

## Variables d'environnement

Copier `backend/.env.example` vers `backend/.env.local` (ou utiliser `../.env.local` racine):

- `BACKEND_PORT` (default: `4000`)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (optionnel)
- `EMAIL_PROVIDER` (`resend` | `sendgrid` | `mailgun`)
- `EMAIL_FROM` (adresse expediteur valide)
- `RESEND_API_KEY` (si provider `resend`)
- `SENDGRID_API_KEY` (si provider `sendgrid`)
- `MAILGUN_API_KEY`, `MAILGUN_DOMAIN` (si provider `mailgun`)
- `MAILGUN_BASE_URL` (optionnel, default `https://api.mailgun.net/v3`)

## Lancer en local

```bash
cd backend
npm install
npm run start:dev
```

API disponible sur `http://localhost:4000/api`.

## Endpoints MVP

- `GET /api/health`
- `GET /api/locations` (Bearer token requis)
- `GET /api/members` (Bearer token requis)
- `GET /api/members/me` (Bearer token requis)
- `GET /api/members/:id` (Bearer token requis)
- `PATCH /api/members/me` (Bearer token requis)
- `PATCH /api/members/:id` (Bearer token requis)
- `POST /api/onboarding` (Bearer token requis)
- `GET /api/organisations` (Bearer token requis)
- `POST /api/organisations` (Bearer token requis)

## Auth

Le backend valide les JWT Supabase via JWKS:

- Issuer attendu: `${NEXT_PUBLIC_SUPABASE_URL}/auth/v1`
- Header HTTP requis: `Authorization: Bearer <access_token>`
