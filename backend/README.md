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
- `EMAIL_BLOCKED_DOMAINS` (optionnel, liste CSV des domaines bloques)
- `EMAIL_CAMPAIGN_MAX_RECIPIENTS` (optionnel, default `5000`)
- `EMAIL_CAMPAIGN_MAX_CREATE_PER_HOUR` (optionnel, default `20`)
- `EMAIL_CAMPAIGN_MAX_QUEUE_PER_HOUR` (optionnel, default `20`)
- `EMAIL_CAMPAIGN_MAX_SEND_PER_HOUR` (optionnel, default `8`)
- `EMAIL_CAMPAIGN_MAX_SEND_PER_DAY` (optionnel, default `40`)
- `EMAIL_CAMPAIGN_MIN_SECONDS_BETWEEN_SENDS` (optionnel, default `20`)
- `EMAIL_SEND_BATCH_SIZE` (optionnel, default `500`)
- `COHERE_API_KEY` (obligatoire pour le module support IA)
- `COHERE_MODEL` (optionnel, default `command-r-plus`)
- `SUPPORT_AI_DAILY_LIMIT` (optionnel, default `20`)
- `SUPPORT_AI_HISTORY_LIMIT` (optionnel, default `30`)
- `SUPPORT_AI_CONTEXT_TURNS` (optionnel, default `6`)
- `SUPPORT_AI_MAX_QUESTION_CHARS` (optionnel, default `1200`)
- `SUPPORT_AI_MAX_TOKENS` (optionnel, default `450`)

## Lancer en local

```bash
cd backend
npm install
npm run start:dev
```

API disponible sur `http://localhost:4000/api`.

## Endpoints MVP

- `GET /api/health`
- `GET /api/health/ready`
- `GET /api/locations` (Bearer token requis)
- `GET /api/members` (Bearer token requis)
- `GET /api/members/me` (Bearer token requis)
- `GET /api/members/:id` (Bearer token requis)
- `PATCH /api/members/me` (Bearer token requis)
- `PATCH /api/members/:id` (Bearer token requis)
- `POST /api/members/contact-actions` (Bearer token requis)
- `POST /api/onboarding` (Bearer token requis)
- `GET /api/organisations` (Bearer token requis)
- `POST /api/organisations` (Bearer token requis)

## Observabilite backend

- Chaque requete est loggee avec:
  - `request_id` (`x-request-id`)
  - methode, path, status, duree
- Health endpoints:
  - `/api/health`: disponibilite service
  - `/api/health/ready`: readiness env + connectivite Supabase (DB)

## Auth

Le backend valide les JWT Supabase via JWKS:

- Issuer attendu: `${NEXT_PUBLIC_SUPABASE_URL}/auth/v1`
- Header HTTP requis: `Authorization: Bearer <access_token>`
