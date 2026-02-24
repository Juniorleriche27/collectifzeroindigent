-- CZI Delivery Pack - Post Migration Verification
-- Run this after executing:
--   sql/2026-02-23_delivery_pack.sql
--
-- Expected usage:
-- 1) Execute on staging/blank Supabase project after pack run.
-- 2) Export results and attach to delivery proof report.

-- =========================================================
-- A) Required tables exist
-- =========================================================
with required(table_name) as (
  select unnest(array[
    'organisation',
    'profile',
    'member',
    'communication_team',
    'announcement',
    'announcement_scope',
    'conversation',
    'conversation_participant',
    'message',
    'email_campaign',
    'email_campaign_recipient',
    'region',
    'prefecture',
    'commune'
  ])
)
select
  r.table_name,
  (t.table_name is not null) as exists_in_public
from required r
left join information_schema.tables t
  on t.table_schema = 'public'
 and t.table_name = r.table_name
order by r.table_name;

-- =========================================================
-- B) RLS enabled on secured tables
-- =========================================================
with secured(relname) as (
  select unnest(array[
    'organisation',
    'profile',
    'member',
    'communication_team',
    'announcement',
    'announcement_scope',
    'conversation',
    'conversation_participant',
    'message',
    'email_campaign',
    'email_campaign_recipient'
  ])
)
select
  s.relname as table_name,
  c.relrowsecurity as rls_enabled
from secured s
left join pg_class c
  on c.relname = s.relname
left join pg_namespace n
  on n.oid = c.relnamespace
where n.nspname = 'public'
order by s.relname;

-- =========================================================
-- C) Required enums
-- =========================================================
with required(enum_name) as (
  select unnest(array[
    'scope_level',
    'conversation_type',
    'email_campaign_status',
    'email_recipient_status',
    'profile_role'
  ])
)
select
  r.enum_name,
  (t.oid is not null) as exists_in_public
from required r
left join pg_type t
  on t.typname = r.enum_name
left join pg_namespace n
  on n.oid = t.typnamespace
 and n.nspname = 'public'
order by r.enum_name;

-- =========================================================
-- D) Core functions present
-- =========================================================
with required(name, args) as (
  select * from (
    values
      ('current_profile_role', ''),
      ('current_member_id', ''),
      ('current_member_region_id', ''),
      ('current_member_prefecture_id', ''),
      ('current_member_commune_id', ''),
      ('scope_matches_member', 'scope_level, uuid, uuid, uuid'),
      ('is_communication_manager', ''),
      ('can_read_announcement_scope', 'uuid, scope_level, uuid, uuid, uuid'),
      ('can_access_conversation', 'uuid'),
      ('can_post_conversation', 'uuid, uuid')
  ) as v(name, args)
)
select
  r.name as function_name,
  r.args as expected_args,
  exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = r.name
      and pg_catalog.oidvectortypes(p.proargtypes) = r.args
  ) as exists_exact_signature
from required r
order by r.name;

-- =========================================================
-- E) Member orientation columns
-- =========================================================
with required(column_name) as (
  select unnest(array[
    'cellule_primary',
    'cellule_secondary',
    'gender',
    'birth_date',
    'age_range',
    'education_level',
    'occupation_status',
    'profession_title',
    'locality',
    'mobility',
    'mobility_zones',
    'engagement_domains',
    'engagement_frequency',
    'engagement_recent_action',
    'business_stage',
    'business_sector',
    'business_needs',
    'org_role',
    'org_name_declared',
    'skills',
    'interests',
    'odd_priorities',
    'goal_3_6_months',
    'support_types',
    'availability',
    'contact_preference',
    'consent_terms',
    'consent_analytics',
    'consent_ai_training_agg',
    'partner_request',
    'org_type'
  ])
)
select
  r.column_name,
  (c.column_name is not null) as exists_in_member
from required r
left join information_schema.columns c
  on c.table_schema = 'public'
 and c.table_name = 'member'
 and c.column_name = r.column_name
order by r.column_name;

-- =========================================================
-- F) Member orientation constraints
-- =========================================================
with required(conname) as (
  select unnest(array[
    'member_cellule_primary_check',
    'member_cellule_secondary_check',
    'member_cellule_secondary_distinct_check',
    'member_contact_preference_check',
    'member_org_type_check',
    'member_odd_priorities_check',
    'member_partner_request_requires_org_check',
    'member_active_profile_requirements_check'
  ])
)
select
  r.conname,
  exists (
    select 1
    from pg_constraint c
    where c.conname = r.conname
      and c.conrelid = 'public.member'::regclass
  ) as exists_on_member
from required r
order by r.conname;

-- =========================================================
-- G) Communication policies inventory
-- =========================================================
select
  p.tablename,
  count(*) as policy_count,
  string_agg(p.policyname, ', ' order by p.policyname) as policies
from pg_policies p
where p.schemaname = 'public'
  and p.tablename in (
    'communication_team',
    'announcement',
    'announcement_scope',
    'conversation',
    'conversation_participant',
    'message',
    'email_campaign',
    'email_campaign_recipient'
  )
group by p.tablename
order by p.tablename;

