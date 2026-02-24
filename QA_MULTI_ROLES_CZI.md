# QA Multi-Roles CZI

Date de lancement QA: 23 fevrier 2026

## Regles de preuve

- Chaque test execute doit avoir une preuve:
  - capture ecran horodatee, ou
  - log API/backend, ou
  - requete SQL (input + output).
- Statuts:
  - `[ ]` non teste
  - `[x]` passe
  - `[!]` echec (bloquant)
  - `[-]` non applicable

## Comptes de test

- `[ ]` member
- `[ ]` pf
- `[ ]` cn
- `[ ]` ca
- `[ ]` admin

## Bloc 1 - Auth et onboarding

- `[ ]` signup/login/logout
- `[ ]` redirection onboarding obligatoire si `profile.member_id` absent
- `[ ]` creation membre onboarding
- `[ ]` liaison `profile.member_id`
- `[ ]` contraintes orientation membre (`cellule_primary`, consent, checks actifs)

Preuves:
- 

## Bloc 2 - Membres et roles

- `[ ]` listing membres selon role
- `[ ]` filtres region/prefecture/commune/organisation
- `[ ]` detail membre visible
- `[ ]` edition membre (roles autorises)
- `[ ]` edition role gouvernance (`admin`, `ca` limites)
- `[ ]` contact direct (email/tel) fiche + liste

Preuves:
- 

## Bloc 3 - Organisations

- `[ ]` lecture organisations
- `[ ]` creation organisation (si table `organisation` presente)
- `[ ]` rattachement membre -> organisation

Preuves:
- 

## Bloc 4 - Communiques

- `[ ]` creation communique publie
- `[ ]` creation communique brouillon
- `[ ]` scopes `all/region/prefecture/commune`
- `[ ]` visibilite conforme au scope pour chaque role

Preuves:
- 

## Bloc 5 - Communaute et prive

- `[ ]` creation canal communaute
- `[ ]` creation conversation privee 1:1
- `[ ]` envoi/lecture messages
- `[ ]` RLS stricte sur conversations privees

Preuves:
- 

## Bloc 6 - Campagnes email

- `[ ]` creation brouillon campagne
- `[ ]` queue campagne + recipients
- `[ ]` scope recipients `all/region/prefecture/commune`
- `[ ]` marquage sent
- `[ ]` permissions creation/gestion (manager uniquement)

Preuves:
- 

## Bloc 7 - SQL et securite

- `[ ]` execution `sql/2026-02-23_delivery_pack.sql` sur staging
- `[ ]` verification post-migration (tables/index/policies/fonctions)
- `[ ]` verification script `npm run verify:rls`
- `[ ]` revue RLS finale (member/profile/communication)

Preuves:
- 

## Bloc 8 - Non-regression frontend/backend

- `[ ]` `npm run lint` root
- `[ ]` `npm run test:e2e` backend
- `[ ]` health backend `/api/health`

Preuves:
- 

## Decision livraison

- `[ ]` AUCUN bloquant restant
- `[ ]` GO staging
- `[ ]` GO production

Signatures:
- Tech:
- Produit:
