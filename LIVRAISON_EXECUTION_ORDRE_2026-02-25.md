# Ordre d execution SQL final (hors email provider)

Ce plan regroupe les scripts a executer maintenant pour finaliser la livraison sans la partie email provider (reportee).

## 1. Pre-requis (deja executes selon historique)

1. `sql/2026-02-23_delivery_pack.sql`
2. `sql/2026-02-24_member_validation_workflow.sql`
3. `sql/2026-02-24_open_community_access.sql`
4. `sql/2026-02-24_owner_admin_guard.sql`
5. `sql/2026-02-24_conversation_permission_hotfix.sql`

## 2. Lot communaute/messagerie (a confirmer en prod)

1. `sql/2026-02-25_cell_community_model.sql`
2. `sql/2026-02-25_message_social_features.sql`
3. `sql/2026-02-25_conversation_creation_permission_fix.sql`
4. `sql/2026-02-25_direct_message_unread.sql`

## 3. Lot support/audit (a executer maintenant)

1. `sql/2026-02-25_support_ai_history.sql`
2. `sql/2026-02-25_member_contact_action_audit.sql`
3. `sql/2026-02-25_member_update_history.sql`

## 4. Verification post-SQL

Executer apres le lot:

```sql
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('support_ai_chat', 'member_contact_action', 'member_update')
order by tablename, policyname;
```

```sql
select proname
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and proname in (
    'can_access_conversation',
    'can_post_conversation',
    'member_in_community_kind',
    'enforce_conversation_structure',
    'enforce_message_thread_consistency'
  )
order by proname;
```

## 5. Note email (report officiel)

Le branchement email provider reel est reporte jusqu a disponibilite:

- domaine CZI
- email pro expediteur
