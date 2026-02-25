# Guide Admin CZI

## 1. Objectif

Ce guide decrit les operations quotidiennes pour un administrateur CZI sur la plateforme.

## 2. Acces et roles

- URL application: `https://collectifzeroindigent.vercel.app`
- Role admin requis pour:
  - valider/rejeter les membres
  - gerer les roles gouvernance
  - moderer les discussions (suppression messages/sous-communautes)
  - gerer communiques et campagnes email

## 3. Workflow membres

### 3.1 Validation onboarding

1. Aller sur `Membres`.
2. Ouvrir une fiche membre en statut `pending`.
3. Choisir:
   - `approve` + cellule primaire/secondaire
   - `reject` + motif obligatoire
4. Verifier la transition vers `active` ou `rejected`.

### 3.2 Gestion roles

1. Ouvrir la fiche membre.
2. Bloc `Role gouvernance`.
3. Selectionner le role cible.
4. Verifier la mise a jour dans `public.profile`.

## 4. Communiques

1. Aller sur `Communiques`.
2. Creer un communique (titre + contenu).
3. Definir le scope: national / region / prefecture / commune.
4. Publier et verifier la visibilite ciblee.

## 5. Communaute

1. Aller sur `Communaute`.
2. Verifier les 4 espaces racines.
3. Creer une sous-communaute uniquement dans les cellules autorisees.
4. Moderer les contenus (suppression admin).

## 6. Support IA

1. Aller sur `Support`.
2. Verifier l usage journalier.
3. Poser une question produit.
4. Verifier la reponse et l historique.

## 7. Verifications quotidiennes minimales

- `Dashboard` accessible sans erreur.
- `Membres` charge correctement.
- `Communaute` sans erreur creation/lecture.
- `Support` repond.
- Backend health:
  - `GET /api/health`
  - `GET /api/health/ready`

## 8. Escalade

En cas d incident, appliquer `RUNBOOK_INCIDENT_CZI.md`.
