# Checklist Livraison CZI (V1 + Extensions Prioritaires)

Date de reference: 22 fevrier 2026  
Objectif: livrer une plateforme stable et exploitable sous 2 jours, sans se perdre.

## Regle de pilotage

- Cette checklist est notre source unique de suivi.
- Chaque item coche doit avoir une preuve: capture UI, log, ou requete SQL.
- Chaque modification code: commit + push `main`.

---

## Bloc A - Les 13 etapes de livraison (a conserver)

### 1) Cadrage V1
- [ ] Valider perimetre V1 final avec responsable CZI (ce qui est "pret" vs "placeholder").

### 2) Pack SQL de reference
- [ ] Regrouper/ordonner les scripts SQL en sequence d'execution unique.
- [ ] Tester ce pack sur une base Supabase propre.

### 3) Matrice des roles
- [ ] Valider les droits exacts `member`, `pf`, `cn`, `ca`, `admin`.

### 4) Workflow membres
- [ ] Valider les transitions de statut (`pending`, `active`, `suspended`) et responsables.

### 5) Ecrans partiels
- [ ] Completer ou assumer explicitement les placeholders (`profils`, `communes-regions`, import/export avance).

### 6) Historique des changements
- [ ] Brancher `member_update` pour tracer qui modifie quoi et quand.

### 7) Securite production
- [ ] Revue RLS complete.
- [ ] Validation DTO + controles d'entree backend.
- [ ] Revue permissions Supabase.

### 8) Observabilite
- [ ] Logs backend/frontend exploitables.
- [ ] Monitoring health + alertes minimales.

### 9) Stabilisation deploiement
- [ ] Vercel/Render: envs propres et verifies.
- [ ] Flux email auth (confirmation/recovery) valide en prod.

### 10) QA multi-roles
- [ ] Plan de test par role execute avec preuves.

### 11) Documentation de passation
- [ ] Guide admin CZI.
- [ ] Guide utilisateur.
- [ ] Runbook incident.

### 12) Livraison officielle
- [ ] Tag release + changelog + backup DB.
- [ ] Demo et validation finale CZI.

### 13) Support post-livraison
- [ ] Definir fenetre de support court terme (2 a 4 semaines).

---

## Bloc B - Nouvelles priorites ajoutees par CZI

### 14) Campagnes email (mass mailing)
- [ ] Envoyer un email en lot:
  - [ ] a tous les membres
  - [ ] par region
  - [ ] par prefecture
  - [ ] par commune
- [ ] Journal des envois (date, cible, expediteur, statut).
- [ ] Protection anti-abus (rate-limit, validation destinataires).

### 15) Communiques CZI sur la plateforme
- [ ] Publier des communiques internes.
- [ ] Ciblage du communique: national, region, prefecture, commune.
- [ ] Fil de lecture pour les membres + date de publication.

### 16) Contact direct depuis l'annuaire membre
- [ ] Contact par email/tel deja present: verifier UX et droits.
- [ ] Option "contacter" depuis fiche/liste avec trace d'action (minimum).

### 17) Espace "Communaute CZI" (discussion collective)
- [ ] Canal commun national.
- [ ] Canaux segmentes (region/prefecture/commune).
- [ ] Messages visibles selon regles de portee.

### 18) Messagerie privee membre <-> membre
- [ ] Conversation privee 1:1.
- [ ] Liste des conversations + unread count.
- [ ] RLS stricte (seuls participants lisent).

### 19) Support intelligent via API Cohere
- [ ] Integrer Cohere dans la section support.
- [ ] Historique de questions/reponses.
- [ ] Garde-fous: prompt system, limites d'usage, message de non-responsabilite.

---

## Bloc C - Plan execution 2 jours (realiste)

## Jour 1 (socle communication)
- [ ] Definir schema DB: `announcement`, `conversation`, `message`, `email_campaign`, `email_campaign_recipient`.
- [ ] Ecrire migrations SQL + policies RLS.
- [ ] Creer endpoints backend REST (lecture/ecriture minimales).
- [ ] Brancher UI minimale:
  - [ ] page communiques
  - [ ] page communaute
  - [ ] page messagerie privee (version simple)

## Jour 2 (mass-mail + support + stabilisation)
- [ ] Brancher module campagnes email (cibles geographiques).
- [ ] Ajouter integration Cohere dans `/app/support`.
- [ ] QA complete multi-roles sur ces nouveaux modules.
- [ ] Fix bloquants + documentation express + livraison.

---

## Definition de "termine"

- [ ] Aucun bug bloquant sur onboarding/login/members/roles.
- [ ] Tous les scripts SQL de la checklist executes en production.
- [ ] Chaque module critique a au moins une preuve de test.
- [ ] Responsable CZI peut:
  - [ ] gerer membres
  - [ ] piloter roles
  - [ ] publier un communique cible
  - [ ] lancer une campagne email ciblee
  - [ ] utiliser support (Cohere)
  - [ ] verifier messagerie communautaire et privee

