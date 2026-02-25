# Changelog

## 2026-02-25

- Refonte support CZI en interface type chat:
  - sidebar historique
  - nouvelle discussion
  - zone de saisie fixe en bas
  - reponses animees et normalisees
- Cadrage prompt support IA:
  - reponses courtes en paragraphe simple
  - retrait markdown/listes
  - contexte institutionnel CZI corrige
- Audit contact membre:
  - endpoint backend `POST /members/contact-actions`
  - trace au clic `mailto/tel`
  - script SQL `member_contact_action_audit`
- Partenariat / A propos:
  - navigation mise a jour
  - page institutionnelle CZI ajoutee
- Observabilite:
  - logs HTTP backend avec `x-request-id`
  - health enrichi (`/api/health`, `/api/health/ready`)
  - script SQL `member_update_history` ajoute
