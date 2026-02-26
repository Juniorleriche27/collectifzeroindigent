# QA Multi-Roles CZI

Date de lancement QA: 23 fevrier 2026
MAJ execution: 25 fevrier 2026 (automatique + preuves SQL production)

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

- `[ ]` member (manuel restant)
- `[ ]` pf (manuel restant)
- `[ ]` cn (manuel restant)
- `[ ]` ca (manuel restant)
- `[x]` admin (preuves UI/SQL disponibles)

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
- `[ ]` audit contact membre (`member_contact_action`) enregistre a chaque clic contact

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
- `[ ]` unread count messages prives (badge + reset lecture)

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

- `[x]` execution `sql/2026-02-23_delivery_pack.sql` (dry-run base propre + production executee)
- `[x]` verification post-migration (tables/index/policies/fonctions)
- `[ ]` verification script `npm run verify:rls` (bloque localement sans env Supabase)
- `[x]` revue RLS finale (member/profile/communication)

Preuves:
- Dry-run et verification SQL A-G: `LIVRAISON_PREUVES_DRY_RUN.md`
- Revue securite/RLS production: `sql/2026-02-25_rls_security_review.sql` (pass tables/rls/policies = true)
- Fonctions critiques `security_definer=true`: `can_access_conversation`, `can_post_conversation`, `current_profile_role`, `enforce_conversation_structure`, `enforce_message_thread_consistency`, `log_member_update`, `member_in_community_kind`
- Hardening privileges applique: `sql/2026-02-25_harden_table_privileges.sql` (plus de grants `anon`, suppression `TRUNCATE/TRIGGER/REFERENCES`)

## Bloc 8 - Non-regression frontend/backend

- `[x]` `npm run lint` root
- `[x]` `npm run test:e2e` backend
- `[x]` health backend `/api/health`
- `[x]` readiness backend `/api/health/ready`
- `[ ]` support IA: format reponse paragraphe simple, sans markdown/listes (validation manuelle finale en production)

Preuves:
- Root: `npm run lint` (OK), `npm run build` (OK)
- Backend: `npm run build` (OK), `npm run test:e2e` (2/2 OK)
- E2E: `HealthController (e2e)` -> `/api/health` et `/api/health/ready` passes

## Decision livraison

- `[ ]` AUCUN bloquant restant
- `[ ]` GO staging
- `[ ]` GO production

Signatures:
- Tech:
- Produit:

---

## Reste a valider manuellement (ordre court)

1. Bloc 1 (onboarding complet) sur un nouveau compte `member`.
2. Bloc 2 (droits membres/roles) avec comptes `pf`, `cn`, `ca`, `admin`.
3. Bloc 4 (communiques): creation publie + brouillon + scopes + lecture conforme.
4. Bloc 5 (communaute/prive): creation sous-communaute cellule, interdiction sur CZI national, unread reset.
5. Bloc 6 (campagnes): creation + queue + scope + permissions manager.

Quand ces 5 points sont valides sans echec bloquant, cocher:
- `AUCUN bloquant restant`
- `GO staging`
- `GO production`
