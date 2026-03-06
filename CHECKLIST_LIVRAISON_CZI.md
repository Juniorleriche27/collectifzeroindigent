# Checklist Livraison CZI (V1 + Extensions Prioritaires)

Date de reference: 23 fevrier 2026  
Objectif: livrer une plateforme stable et exploitable, avec preuves de QA et passation.
MAJ locale: 6 mars 2026 (email reel valide en production via Resend; auth `mot de passe oublie` + module dons MVP + fondation SQL carte membre livres; PayDunya test sandbox valide; paiement production PayDunya bloque par KYC non valide; page publique `Accueil + A propos` au domaine principal livree en local).

## Regle de pilotage

- Cette checklist est notre source unique de suivi.
- Chaque item coche doit avoir une preuve: capture UI, log, ou requete SQL.
- Chaque modification code: commit + push `main`.

## Legende

- `[x]` Termine
- `[ ]` A faire / partiel (detail dans la ligne)

---

## Bloc A - Les 13 etapes de livraison (a conserver)

### 1) Cadrage V1
- [ ] Valider perimetre V1 final avec responsable CZI (ce qui est "pret" vs "placeholder").

### 2) Pack SQL de reference
- [ ] Regrouper/ordonner les scripts SQL en sequence d'execution unique.
- [ ] Tester ce pack sur une base Supabase propre.

Scripts SQL disponibles a date:
- `sql/2026-02-21_create_organisation_table.sql`
- `sql/2026-02-21_fix_member_profile_rls.sql`
- `sql/2026-02-21_link_member_organisation.sql`
- `sql/2026-02-21_role_based_member_access.sql`
- `sql/2026-02-22_extend_profile_role_enum.sql`
- `sql/2026-02-22_profile_role_governance_access.sql`
- `sql/2026-02-23_communication_core.sql`
- `sql/2026-02-23_fix_announcement_scope_recursion.sql`
- `sql/2026-02-23_allow_pf_cn_communication.sql`
- `sql/2026-02-23_member_orientation_foundation.sql`
- `sql/2026-02-23_member_orientation_conditional_checks.sql`
- `sql/2026-02-24_member_validation_workflow.sql`
- `sql/2026-02-24_open_community_access.sql`
- `sql/2026-02-24_owner_admin_guard.sql`
- `sql/2026-02-24_conversation_permission_hotfix.sql`
- `sql/2026-02-25_cell_community_model.sql`
- `sql/2026-02-25_message_social_features.sql`
- `sql/2026-02-25_conversation_creation_permission_fix.sql`
- `sql/2026-02-25_direct_message_unread.sql`
- `sql/2026-02-25_support_ai_history.sql`
- `sql/2026-02-25_member_contact_action_audit.sql`
- `sql/2026-02-25_member_update_history.sql`
- `sql/2026-03-03_member_card_request_foundation.sql`
- `sql/2026-03-03_donation_module.sql`

### 3) Matrice des roles
- [ ] Valider les droits exacts `member`, `pf`, `cn`, `ca`, `admin` (RLS en place, validation metier finale non signee).
- [ ] Ajouter la regle gouvernance admin: un `admin` peut nommer un autre `admin` et lui retirer ce droit.
- [ ] Ajouter la regle compte proprietaire technique: `ylamadokou@gmail.com` reste `admin` non-revocable via ecran.
- [ ] Prevoir script SQL de secours (break-glass) pour restaurer le droit `admin` du compte proprietaire.

### 4) Workflow membres
- [ ] Valider les transitions de statut (`pending`, `active`, `suspended`) et responsables.

### 5) Ecrans partiels
- [x] Completer ou assumer explicitement les placeholders (`profils`, `communes-regions`, import/export avance).
- [x] Ajouter page `A propos` (contenu institutionnel CZI) en version interne + publique; validation coherence metier CZI en attente.

### 6) Historique des changements
- [ ] Brancher `member_update` pour tracer qui modifie quoi et quand. (Script SQL execute en production le 25 fevrier 2026: `sql/2026-02-25_member_update_history.sql`; QA fonctionnelle metier en attente)

### 7) Securite production
- [x] Revue RLS complete. (Executee en production le 25 fevrier 2026 avec `sql/2026-02-25_rls_security_review.sql`: pass_tables_exist=true, pass_rls_enabled=true, pass_policy_present=true)
- [x] Validation DTO + controles d'entree backend.
- [x] Revue permissions Supabase. (Durcissement applique le 25 fevrier 2026 via `sql/2026-02-25_harden_table_privileges.sql`: grants `anon` retires, suppression des privileges excessifs `TRUNCATE/TRIGGER/REFERENCES`)

### 8) Observabilite
- [x] Logs backend/frontend exploitables. (Backend: logs HTTP avec `x-request-id`, methode, status, duree; front: erreurs action/API contextualisees)
- [ ] Monitoring health + alertes minimales. (Endpoints `/api/health` + `/api/health/ready` livres; configuration alerting externe en attente)

### 9) Stabilisation deploiement
- [ ] Vercel/Render: envs propres et verifies.
- [ ] Flux email auth (confirmation/recovery) valide en prod.
- [ ] Paiement PayDunya production active (bloquant externe: validation KYC PayDunya non finalisee au 6 mars 2026).

### 10) QA multi-roles
- [ ] Plan de test par role execute avec preuves (template pret: `QA_MULTI_ROLES_CZI.md`, execution en attente).

### 11) Documentation de passation
- [x] Guide admin CZI. (Livre: `GUIDE_ADMIN_CZI.md`)
- [x] Guide utilisateur. (Livre: `GUIDE_UTILISATEUR_CZI.md`)
- [x] Runbook incident. (Livre: `RUNBOOK_INCIDENT_CZI.md`)

### 12) Livraison officielle
- [ ] Tag release + changelog + backup DB.
- [ ] Demo et validation finale CZI.

### 13) Support post-livraison
- [ ] Definir fenetre de support court terme (2 a 4 semaines).

---

## Bloc B - Nouvelles priorites ajoutees par CZI

### 14) Campagnes email (mass mailing)
- [x] Envoyer un email en lot (valide en production le 3 mars 2026 via Resend: brouillon, mise en file, envoi reel, et relance des echecs rate-limit):
  - [x] a tous les membres
  - [x] par region
  - [x] par prefecture
  - [x] par commune
- [x] Journal des envois (date, cible, expediteur, statut).
- [x] Protection anti-abus (rate-limit, validation destinataires). (Quotas en place + hotfix 3 mars 2026: throttle envoi, retry rate-limit, re-queue intelligent sans renvoyer aux destinataires deja `sent`)

### 15) Communiques CZI sur la plateforme
- [x] Publier des communiques internes.
- [x] Ciblage du communique: national, region, prefecture, commune.
- [x] Fil de lecture pour les membres + date de publication.
- [ ] Modifier un communique existant (code livre, QA fonctionnelle en attente).
- [ ] Supprimer un communique existant (code livre, QA fonctionnelle en attente).

### 16) Contact direct depuis l'annuaire membre
- [x] Contact par email/tel deja present: verifier UX et droits.
- [ ] Option "contacter" depuis fiche/liste avec trace d'action (minimum). (Code backend+frontend livre + SQL execute en production le 25 fevrier 2026: `sql/2026-02-25_member_contact_action_audit.sql`; QA metier en attente)

### 16-bis) Partenariat (ex-Organisations)
- [ ] Renommer la page `Organisations` en page `Partenariat` dans la navigation.
- [ ] Exposer les 4 actions metier:
  - [ ] Creer une entreprise
  - [ ] Creer une association
  - [ ] Ajouter son entreprise
  - [ ] Ajouter son association

### 17) Espace "Communaute CZI" (discussion collective)
- [ ] Imposer 4 communautes racines:
  - [ ] Communaute CZI (national)
  - [ ] Cellule des jeunes engages
  - [ ] Cellule des jeunes entrepreneurs
  - [ ] Cellule des responsables d'associations et mouvements de jeunes
- [ ] Communaute CZI (national): lecture/ecriture membres CZI, sans creation de groupes/sous-communautes. (Code livre + SQL execute en production le 25 fevrier 2026: `sql/2026-02-25_cell_community_model.sql`; QA en attente)
- [ ] Communautes de cellule: autoriser creation de sous-communautes de discussion. (Code livre + SQL execute en production le 25 fevrier 2026: `sql/2026-02-25_cell_community_model.sql`; QA en attente)
- [ ] Rendre la sidebar interactive (reduire/agrandir + persistance etat). (Code livre front; QA UI en attente)
- [ ] Styliser le panneau communaute en mode "fil social". (Code livre front; QA UI en attente)
- [ ] Distinguer visuellement mes messages vs messages des autres. (Code livre front; QA UI en attente)
- [ ] Autoriser commentaires/reponses sur messages (thread). (Code livre + SQL execute en production le 25 fevrier 2026: `sql/2026-02-25_message_social_features.sql`; QA en attente)
- [ ] Autoriser edition de son message/commentaire. (Code livre + SQL execute en production le 25 fevrier 2026: `sql/2026-02-25_message_social_features.sql`; QA en attente)
- [ ] Autoriser tags `@membre` dans message/commentaire. (Code livre + SQL execute en production le 25 fevrier 2026: `sql/2026-02-25_message_social_features.sql`; QA en attente)
- [ ] Autoriser like/unlike des messages. (Code livre + SQL execute en production le 25 fevrier 2026: `sql/2026-02-25_message_social_features.sql`; QA en attente)
- [ ] Autoriser suppression des sous-communautes par `admin` et par createur de la sous-communaute. (Code livre API/UI, QA en attente)
- [ ] Autoriser suppression des messages par `admin` (national + communautes + sous-communautes). (Code livre API/UI + policy existante `message_delete`, QA en attente)
- [ ] Isolation stricte par cellule:
  - [ ] impossible de rejoindre les sous-communautes d'une autre cellule
  - [ ] impossible de voir les sous-communautes d'une autre cellule
- [ ] Visibilite des sous-communautes limitee aux membres de la cellule concernee. (Code livre + SQL execute en production le 25 fevrier 2026: `sql/2026-02-25_cell_community_model.sql`; QA en attente)
- [ ] Interdire explicitement la creation de sous-communaute dans la Communaute CZI (national). (Code livre + SQL execute en production le 25 fevrier 2026: `sql/2026-02-25_cell_community_model.sql`; QA en attente)
- [ ] Corriger le bug `Internal server error` sur la creation de discussion dans `/app/communaute`.
- [ ] Corriger le refus `Permission insuffisante pour creer cette conversation` (fallback role `profile.user_id/id` + re-application policies conversation en prod, y compris creation directe/sous-communaute).
- [ ] Executer QA multi-roles post-refonte communaute (preuves UI + logs backend).

### 18) Messagerie privee membre <-> membre
- [x] Conversation privee 1:1.
- [ ] Liste des conversations + unread count (code livre + SQL execute en production le 25 fevrier 2026: `sql/2026-02-25_direct_message_unread.sql`; QA en attente).
- [x] RLS stricte (seuls participants lisent).

### 19) Support intelligent via API Cohere
- [ ] Integrer Cohere dans la section support. (Code backend+frontend livre + SQL execute en production le 25 fevrier 2026: `sql/2026-02-25_support_ai_history.sql`; env Render/Vercel configure; QA fonctionnelle en attente)
- [ ] Historique de questions/reponses.
- [ ] Garde-fous: prompt system, limites d'usage, message de non-responsabilite.

### 20) Carte membre CZI (2900 F) + photo + impression
- [ ] Logique metier a valider formellement par CZI (definition "automatique" = generation auto du fichier carte, pas impression auto).
- [x] Foundation DB livree en local:
  - [x] colonnes `photo_url`, `photo_status`, `photo_rejection_reason` dans `public.member`
  - [x] table `public.member_card_request` (prix 2900, paiement, statuts carte, livraison, impression)
  - [x] contraintes de base + `unique(member_id)` (MVP 1 carte active/membre)
  - [x] trigger auto-ready (`requested=true`, `payment_status='paid'`, photo presente) avec generation auto `card_number`
  - [x] policies RLS membre vs CN/PF/Admin (socle)
- [ ] Upload photo Supabase Storage (`member-photos/member/{member_id}/photo.jpg`) branche en front/back.
- [ ] Onboarding UX:
  - [ ] bloc "Carte de membre CZI - 2900 F"
  - [ ] checkbox demande carte
  - [ ] upload photo obligatoire si carte demandee
  - [ ] mode remise `Retrait/Livraison` + infos livraison
- [ ] Paiement 2900 F branche (provider a confirmer) + webhook `payment_status='paid'`.
- [ ] Generation carte PDF/PNG server-side (template HTML -> PDF) + upload bucket `member-cards`.
- [ ] Backoffice CN/PF/Admin:
  - [ ] page `Cartes` (filtre `ready`)
  - [ ] action `Imprimer` -> `printed_at`, `print_by`, `card_status='printed'`
  - [ ] action `Livre` -> `delivered_at`, `card_status='delivered'`
- [ ] Validation procedure "Avantages carte" par CZI (ne pas afficher comme garanties tant que non signe).

### 21) Auth: mot de passe oublie
- [x] Lien `Mot de passe oublie ?` ajoute sur `/login`.
- [x] Page `/forgot-password` (envoi email reset Supabase).
- [x] Page `/reset-password` (mise a jour du mot de passe).
- [x] Callback auth renforce pour liens Supabase `code` et `token_hash` (signup + recovery).
- [ ] Validation en production du flux email recovery (template + redirect URL autorisee Supabase).

### 22) Dons (faire un don)
- [x] Table `public.donation` + indexes + trigger `updated_at` + RLS (`sql/2026-03-03_donation_module.sql`) livres en local.
- [x] API backend Nest:
  - [x] `GET /api/donations`
  - [x] `POST /api/donations`
  - [x] `PATCH /api/donations/:id`
- [x] Frontend `/app/dons` (creation don + historique + statuts + actions de base).
- [x] Paiement test sandbox PayDunya valide (generation checkout + facture test OK).
- [ ] Paiement reel production (provider/webhook) pour passage automatique `pending -> paid` (bloque tant que KYC PayDunya n est pas valide).
- [ ] Reconciliation comptable/rapports finance (exports, justificatifs, audit complet).

### 23) Site vitrine public (domaine principal)
- [x] Le domaine principal ouvre d abord une page publique `Accueil`.
- [x] Section `A propos` visible sans inscription.
- [x] Header public avec liens `Accueil`, `A propos`, `Connexion`, `Inscription`, `Plateforme`.
- [x] Design modernise avec galerie d images issues du dossier PDF CZI.
- [ ] Validation finale contenu/ton/branding par responsables CZI.

---

## Bloc C - Plan execution 2 jours (realiste)

## Jour 1 (socle communication)
- [x] Definir schema DB: `announcement`, `conversation`, `message`, `email_campaign`, `email_campaign_recipient`.
- [x] Ecrire migrations SQL + policies RLS.
- [x] Creer endpoints backend REST (lecture/ecriture minimales).
- [x] Brancher UI minimale:
  - [x] page communiques
  - [x] page communaute
  - [x] page messagerie privee (version simple)

## Jour 2 (mass-mail + support + stabilisation)
- [x] Brancher module campagnes email (cibles geographiques).
- [ ] Ajouter integration Cohere dans `/app/support`. (Code livre le 24 fevrier 2026; execution SQL + configuration env + QA en attente)
- [ ] QA complete multi-roles sur ces nouveaux modules.
- [ ] Fix bloquants + documentation express + livraison.

---

## Bloc D - Plan finalisation livraison (a executer maintenant)

### D1) SQL et schema
- [x] Produire un script unique d'execution (ordre + prerequis + rollback minimal) -> `sql/2026-02-23_delivery_pack.sql`.
- [x] Dry-run sur base Supabase propre + preuve (captures/exports SQL) -> verification A-G validee (preuves partagees le 24 fevrier 2026) avec `sql/2026-02-23_delivery_pack_verification.sql`.
- [x] Verifier compatibilite RLS actuelle avec `scripts/verify-rls.mjs` (script aligne avec lecture reseau + fallback `profile.user_id/id`).

### D2) Fonctionnel manquant prioritaire
- [x] Brancher envoi email reel (Resend/SendGrid/Mailgun) au lieu du seul "marquer envoye". (Valide en production le 3 mars 2026 via Resend + preuves UI/SQL)
- [ ] Integrer support intelligent (Cohere) dans `/app/support`. (Code backend+frontend + UI chat livre; SQL execute en production le 25 fevrier 2026: `sql/2026-02-25_support_ai_history.sql`; QA finale en attente)
- [ ] Cadrer le Support IA avec le contenu institutionnel CZI (vision, mission, cibles, axes strategiques). (Prompt system ajuste le 25 fevrier 2026 + reformattage paragraphe; validation metier finale en attente)
- [ ] Implementer la page `A propos` avec contenu institutionnel CZI. (Pages interne + publique livres; validation metier UI/contenu en attente)
- [ ] Transformer `Organisations` en `Partenariat` avec 4 actions (creer entreprise, creer association, ajouter son entreprise, ajouter son association). (Code livre le 25 fevrier 2026; validation fonctionnelle en attente)
- [ ] Ajouter unread count messagerie privee. (Code livre + SQL execute en production le 25 fevrier 2026: `sql/2026-02-25_direct_message_unread.sql`; QA en attente)
- [ ] Ajouter trace minimale d'action "contacter membre". (Code backend+frontend livre + SQL execute en production le 25 fevrier 2026: `sql/2026-02-25_member_contact_action_audit.sql`; QA en attente)
- [ ] Brancher `member_update` pour historiser les modifications membres (qui, quoi, quand). (Script execute en production le 25 fevrier 2026: `sql/2026-02-25_member_update_history.sql`; QA en attente)
- [ ] Corriger `Internal server error` sur creation discussion communaute. (Correctif code livre + SQL `sql/2026-02-24_open_community_access.sql` execute en production le 24 fevrier 2026; QA fonctionnelle en attente)
- [ ] Refondre la communaute en 4 espaces racines (CZI national + 3 cellules) et retirer la logique de segmentation geographique. (Code livre + SQL execute en production le 25 fevrier 2026: `sql/2026-02-25_cell_community_model.sql`; QA en attente)
- [ ] Bloquer la creation de sous-communaute dans CZI national; autoriser seulement dans les 3 communautes de cellule. (Code livre + SQL execute en production le 25 fevrier 2026: `sql/2026-02-25_cell_community_model.sql`; QA en attente)
- [ ] Appliquer l'isolation stricte des sous-communautes par cellule (lecture/adhesion/ecriture). (Code livre + SQL execute en production le 25 fevrier 2026: `sql/2026-02-25_cell_community_model.sql`; QA en attente)
- [ ] Activer les fonctions "reseau social" du module communaute (reply/comment, edit, tags, like/unlike). (Code livre + SQL execute en production le 25 fevrier 2026: `sql/2026-02-25_message_social_features.sql`; QA en attente)
- [ ] Activer la suppression de sous-communaute (admin/createur) et suppression des messages par admin dans tout l'espace communaute. (Code livre, QA en attente)
- [ ] Corriger le refus `Permission insuffisante pour creer cette conversation` pour comptes admin et membres. (Hotfix v2 code livre + SQL execute en production le 25 fevrier 2026: `sql/2026-02-25_conversation_creation_permission_fix.sql`; QA fonctionnelle en attente)
- [ ] Implementer la gouvernance admin: admin->admin grant/revoke + protection du compte proprietaire (`ylamadokou@gmail.com`) en UI. (Protection UI livree + SQL `sql/2026-02-24_owner_admin_guard.sql` execute en production le 24 fevrier 2026; QA en attente)

### D3) Qualite et exploitation
- [ ] Plan de test multi-roles complet (`member`, `pf`, `cn`, `ca`, `admin`) avec preuves.
- [x] Documentation de passation (admin, utilisateur, runbook incident). (Livres: `GUIDE_ADMIN_CZI.md`, `GUIDE_UTILISATEUR_CZI.md`, `RUNBOOK_INCIDENT_CZI.md`)
- [ ] Preparation release (tag, changelog, backup DB, demo finale). (`CHANGELOG.md` + `RELEASE_CHECKLIST_CZI.md` livres; backup/tag/demo en attente execution)

---

## Bloc E - Ordre de livraison valide (sequence d'execution)

1. [x] Finaliser le pack SQL de livraison et faire un dry-run sur une base Supabase vierge avec preuves (captures + resultats).
2. [ ] Implementer le workflow de validation membre (`pending -> active/rejected`) avec ecran backoffice (approve/reject/changer cellule + motif). (Code livre + SQL `sql/2026-02-24_member_validation_workflow.sql` execute en production le 24 fevrier 2026, QA fonctionnelle finale en attente)
3. [x] Passer l'onboarding enrichi en wizard 5-7 etapes avec sauvegarde progressive et validations conditionnelles deja en DB. (Livre et valide en UI le 24 fevrier 2026: wizard 6 etapes + sauvegarde locale + validation inter-etapes + correction payload final)
4. [x] Brancher l'envoi email reel (Resend/SendGrid/Mailgun) pour les campagnes ciblees (toutes regions/region/prefecture/commune). (Valide en production le 3 mars 2026 via Resend)
5. [x] Ajouter protections campagnes: rate-limit, anti-abus, validation destinataires, statuts d'envoi robustes. (Valide apres hotfix 3 mars 2026: throttle, retry 429, re-queue des `failed`)
6. [ ] Integrer le Support IA Cohere dans `/app/support` (prompt system, limites d'usage, disclaimer, historique Q/R). (Code + SQL executes en production le 25 fevrier 2026; validation QA finale en attente)
7. [ ] Completer la messagerie privee: unread count, marquage lu/non lu, stabilite UX. (Code + SQL executes en production; validation UX en attente)
8. [ ] Ajouter la trace d'action `contacter membre` (audit minimal). (Code + SQL executes en production le 25 fevrier 2026; QA en attente)
9. [ ] Brancher `member_update` pour historiser les modifications membres (qui, quoi, quand). (SQL execute en production le 25 fevrier 2026; QA en attente)
10. [ ] Corriger le bug `Internal server error` sur creation discussion (`/app/communaute`). (Code livre + SQL `sql/2026-02-24_open_community_access.sql` execute en production; validation UI en attente)
11. [ ] Refondre la communaute en 4 communautes racines: CZI national + 3 communautes de cellule. (Code + SQL executes en production le 25 fevrier 2026; validation UI en attente)
12. [ ] Interdire la creation de sous-communaute dans CZI national; autoriser les sous-communautes seulement dans les communautes de cellule. (Code + SQL executes en production le 25 fevrier 2026; validation UI en attente)
13. [ ] Appliquer l'isolation stricte entre cellules (aucune lecture/adhesion croisee des sous-communautes). (Code + SQL executes en production le 25 fevrier 2026; validation UI en attente)
14. [ ] Corriger le refus `Permission insuffisante pour creer cette conversation` (fallback role + policies re-appliquees). (Code + SQL executes en production le 25 fevrier 2026; validation UI en attente)
15. [ ] Verrouiller la matrice des roles (`member`, `pf`, `cn`, `ca`, `admin`) + regle `admin` peut gerer `admin`.
16. [ ] Proteger le compte proprietaire `ylamadokou@gmail.com` (non-revocable via interface) + procedure SQL de recuperation. (Protection UI livree + SQL `sql/2026-02-24_owner_admin_guard.sql` execute en production; validation UI en attente)
17. [x] Faire la revue securite/RLS complete (lecture/ecriture par role + permissions Supabase). (Valide en production le 25 fevrier 2026 apres hardening privileges)
18. [ ] Mettre l'observabilite: logs exploitables front/back + health check + alertes minimales.
19. [ ] Executer le plan QA multi-roles complet avec preuves.
20. [ ] Preparer la passation: guide admin, guide utilisateur, runbook incident.
21. [ ] Faire la release officielle: backup DB, tag, changelog, demo de validation CZI.
22. [ ] Definir le support post-livraison (2 a 4 semaines).

---

## Definition de "termine"

- [ ] Aucun bug bloquant sur onboarding/login/members/roles.
- [ ] Tous les scripts SQL de la checklist executes en production.
- [ ] Chaque module critique a au moins une preuve de test.
- [ ] Responsable CZI peut:
  - [x] gerer membres
  - [x] piloter roles
  - [x] publier un communique cible
  - [x] lancer une campagne email ciblee (envoi reel provider)
  - [ ] utiliser support (Cohere)
  - [ ] creer une discussion sans erreur interne dans `/app/communaute`
  - [ ] utiliser les 4 communautes racines (CZI national + 3 cellules) selon regles metier
  - [ ] creer une sous-communaute uniquement dans sa communaute de cellule
  - [ ] ne pas pouvoir creer de sous-communaute dans CZI national
  - [ ] ne pas pouvoir voir/rejoindre les sous-communautes d'une autre cellule
  - [ ] ne plus avoir l'erreur `Permission insuffisante pour creer cette conversation` (admin + membres)
  - [ ] garantir la protection admin du compte proprietaire (`ylamadokou@gmail.com`)
  - [x] verifier messagerie privee
