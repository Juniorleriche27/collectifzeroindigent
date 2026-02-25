-- Revue securite / RLS (lecture seule)
-- Objectif: verifier rapidement les points critiques avant release.

with expected(table_name) as (
  values
    ('member'),
    ('profile'),
    ('announcement'),
    ('announcement_scope'),
    ('communication_team'),
    ('conversation'),
    ('conversation_participant'),
    ('message'),
    ('email_campaign'),
    ('email_campaign_recipient'),
    ('support_ai_chat'),
    ('member_contact_action'),
    ('member_update')
),
table_state as (
  select
    e.table_name,
    (c.oid is not null) as exists_in_public,
    coalesce(c.relrowsecurity, false) as rls_enabled,
    coalesce(c.relforcerowsecurity, false) as rls_forced
  from expected e
  left join pg_class c
    on c.relname = e.table_name
   and c.relnamespace = 'public'::regnamespace
),
policy_state as (
  select
    p.tablename as table_name,
    count(*) as policy_count,
    string_agg(p.policyname || ' [' || p.cmd || ']', ', ' order by p.policyname) as policies
  from pg_policies p
  where p.schemaname = 'public'
    and p.tablename in (select table_name from expected)
  group by p.tablename
)
select
  t.table_name,
  t.exists_in_public,
  t.rls_enabled,
  t.rls_forced,
  coalesce(ps.policy_count, 0) as policy_count,
  coalesce(ps.policies, '') as policies
from table_state t
left join policy_state ps on ps.table_name = t.table_name
order by t.table_name;

with expected(table_name) as (
  values
    ('member'),
    ('profile'),
    ('announcement'),
    ('announcement_scope'),
    ('communication_team'),
    ('conversation'),
    ('conversation_participant'),
    ('message'),
    ('email_campaign'),
    ('email_campaign_recipient'),
    ('support_ai_chat'),
    ('member_contact_action'),
    ('member_update')
),
table_state as (
  select
    e.table_name,
    (c.oid is not null) as exists_in_public,
    coalesce(c.relrowsecurity, false) as rls_enabled
  from expected e
  left join pg_class c
    on c.relname = e.table_name
   and c.relnamespace = 'public'::regnamespace
),
policy_state as (
  select
    p.tablename as table_name,
    count(*) as policy_count
  from pg_policies p
  where p.schemaname = 'public'
    and p.tablename in (select table_name from expected)
  group by p.tablename
)
select
  bool_and(t.exists_in_public) as pass_tables_exist,
  bool_and(t.rls_enabled) as pass_rls_enabled,
  bool_and(
    case
      when t.exists_in_public then coalesce(ps.policy_count, 0) > 0
      else false
    end
  ) as pass_policy_present,
  array_agg(t.table_name order by t.table_name)
    filter (where not t.exists_in_public) as missing_tables,
  array_agg(t.table_name order by t.table_name)
    filter (where t.exists_in_public and not t.rls_enabled) as tables_without_rls,
  array_agg(t.table_name order by t.table_name)
    filter (where t.exists_in_public and coalesce(ps.policy_count, 0) = 0) as tables_without_policies
from table_state t
left join policy_state ps on ps.table_name = t.table_name;

-- Verifier les privileges explicites potentiellement sensibles.
select
  grantee,
  table_name,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in (
    'member',
    'profile',
    'announcement',
    'announcement_scope',
    'communication_team',
    'conversation',
    'conversation_participant',
    'message',
    'email_campaign',
    'email_campaign_recipient',
    'support_ai_chat',
    'member_contact_action',
    'member_update'
  )
  and grantee in ('anon', 'authenticated')
order by grantee, table_name, privilege_type;

-- Fonctions critiques (presence + security definer)
select
  p.proname,
  p.prosecdef as security_definer
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'current_profile_role',
    'can_access_conversation',
    'can_post_conversation',
    'member_in_community_kind',
    'enforce_conversation_structure',
    'enforce_message_thread_consistency',
    'log_member_contact_action',
    'log_member_update'
  )
order by p.proname;
