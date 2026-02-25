# Release Checklist CZI

## 1. Preconditions

- [ ] Tous les scripts SQL requis executes en production.
- [ ] QA multi-roles executee avec preuves.
- [ ] Aucun bug bloquant ouvert.

## 2. Backup et securite

- [ ] Backup base Supabase lance et verifie.
- [ ] Variables d environnement front/back verifiees.
- [ ] Endpoint `GET /api/health/ready` retourne `ready`.

## 3. Build & quality

- [ ] `npm run lint` (frontend) passe.
- [ ] `npm run build` (frontend) passe.
- [ ] `npm run lint` (backend) passe.
- [ ] `npm run build` (backend) passe.

## 4. Livraison

- [ ] Commit final pousse sur `main`.
- [ ] Tag git cree (ex: `v1.0.0-czi`).
- [ ] Changelog mis a jour.
- [ ] Demo de validation faite avec CZI.

## 5. Post-livraison

- [ ] Fenetre support definie (2 a 4 semaines).
- [ ] Contact support et procedure incident communiques.
