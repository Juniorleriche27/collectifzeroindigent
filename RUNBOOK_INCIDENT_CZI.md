# Runbook Incident CZI

## 1. Objectif

Procedure standard pour diagnostiquer et resoudre un incident en production.

## 2. Niveaux severite

- `SEV-1`: plateforme indisponible ou perte fonction critique.
- `SEV-2`: fonctionnalite majeure degradee (communaute/support/membres).
- `SEV-3`: bug limite ou contour possible.

## 3. Verification rapide (5 minutes)

1. Verifier frontend Vercel:
   - statut deploy
   - logs runtime
2. Verifier backend Render:
   - statut service
   - logs live
3. Verifier health backend:
   - `GET /api/health`
   - `GET /api/health/ready`
4. Verifier Supabase:
   - status project
   - execution recente des scripts SQL

## 4. Checklist diagnostic technique

## 4.1 Auth/session

- erreurs login/signup
- expiration token
- variables Supabase front/back

## 4.2 API backend

- erreurs 4xx/5xx dans logs Render
- `x-request-id` pour tracer les requetes
- validation DTO en echec

## 4.3 Base de donnees

- verifier policies RLS
- verifier tables/fonctions attendues
- verifier scripts SQL recents executes

## 5. Actions de remediation

## 5.1 Incident deploy

1. Redeployer dernier commit stable.
2. Si necessaire, rollback au commit precedent.

## 5.2 Incident SQL

1. Identifier le script fautif.
2. Appliquer script correctif valide.
3. Rejouer requetes de verification.

## 5.3 Incident fonctionnel

1. Reproduire avec un compte test.
2. Capturer logs + capture ecran + request id.
3. Corriger en branche, tester local, deploy.

## 6. Communication incident

- Ouvrir un ticket incident interne.
- Publier:
  - impact
  - perimetre
  - ETA correction
- Cloture avec post-mortem court.

## 7. Post-mortem minimal

- cause racine
- detection
- correction appliquee
- prevention (test, alerte, checklist)
