-- CZI Delivery SQL Pack
-- Generated on 2026-02-23
-- Purpose: execute core schema + RLS + communication + member orientation foundations in one ordered run.
-- Note: run on a backup/staging first, then production.
--

-- ===================================================================
-- BEGIN sql/2026-02-21_create_organisation_table.sql
-- ===================================================================
begin;

create extension if not exists pgcrypto;

create table if not exists public.organisation (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('association', 'enterprise')),
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists organisation_name_type_uidx
  on public.organisation (lower(name), type);

create or replace function public.set_organisation_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_organisation_updated_at on public.organisation;
create trigger trg_organisation_updated_at
before update on public.organisation
for each row
execute function public.set_organisation_updated_at();

alter table public.organisation enable row level security;

drop policy if exists organisation_select_authenticated on public.organisation;
create policy organisation_select_authenticated
on public.organisation
for select
using (auth.uid() is not null);

drop policy if exists organisation_insert_authenticated on public.organisation;
create policy organisation_insert_authenticated
on public.organisation
for insert
with check (auth.uid() is not null and created_by = auth.uid());

drop policy if exists organisation_update_owner on public.organisation;
create policy organisation_update_owner
on public.organisation
for update
using (created_by = auth.uid())
with check (created_by = auth.uid());

drop policy if exists organisation_delete_owner on public.organisation;
create policy organisation_delete_owner
on public.organisation
for delete
using (created_by = auth.uid());

commit;


-- ===================================================================
-- END sql/2026-02-21_create_organisation_table.sql
-- ===================================================================

-- ===================================================================
-- BEGIN sql/2026-02-21_fix_member_profile_rls.sql
-- ===================================================================
begin;

alter table public.profile enable row level security;
alter table public.member enable row level security;

do $$
declare
  p record;
  profile_auth_column text;
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'profile' and column_name = 'user_id'
  ) then
    profile_auth_column := 'user_id';
  elsif exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'profile' and column_name = 'id'
  ) then
    profile_auth_column := 'id';
  else
    raise exception 'public.profile must contain either user_id or id column for RLS.';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'member' and column_name = 'user_id'
  ) then
    raise exception 'public.member.user_id is required for RLS policies.';
  end if;

  for p in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'profile'
  loop
    execute format('drop policy if exists %I on public.profile', p.policyname);
  end loop;

  for p in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'member'
  loop
    execute format('drop policy if exists %I on public.member', p.policyname);
  end loop;
  execute format(
    'create policy profile_select_self on public.profile for select using (%I = auth.uid())',
    profile_auth_column
  );
  execute format(
    'create policy profile_insert_self on public.profile for insert with check (%I = auth.uid())',
    profile_auth_column
  );
  execute format(
    'create policy profile_update_self on public.profile for update using (%I = auth.uid()) with check (%I = auth.uid())',
    profile_auth_column,
    profile_auth_column
  );

  create policy member_select_self
  on public.member
  for select
  using (user_id = auth.uid());

  create policy member_insert_self
  on public.member
  for insert
  with check (user_id = auth.uid());

  create policy member_update_self
  on public.member
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
end $$;

commit;


-- ===================================================================
-- END sql/2026-02-21_fix_member_profile_rls.sql
-- ===================================================================

-- ===================================================================
-- BEGIN sql/2026-02-21_link_member_organisation.sql
-- ===================================================================
begin;

alter table public.member
  add column if not exists organisation_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'member_organisation_id_fkey'
      and conrelid = 'public.member'::regclass
  ) then
    alter table public.member
      add constraint member_organisation_id_fkey
      foreign key (organisation_id)
      references public.organisation(id)
      on update cascade
      on delete set null;
  end if;
end
$$;

create index if not exists idx_member_organisation_id
  on public.member (organisation_id);

update public.member m
set organisation_id = o.id
from public.organisation o
where m.organisation_id is null
  and m.join_mode::text in ('association', 'enterprise')
  and m.org_name is not null
  and lower(trim(m.org_name)) = lower(trim(o.name))
  and lower(trim(o.type)) = lower(trim(m.join_mode::text));

commit;


-- ===================================================================
-- END sql/2026-02-21_link_member_organisation.sql
-- ===================================================================

-- ===================================================================
-- BEGIN sql/2026-02-22_extend_profile_role_enum.sql
-- ===================================================================
-- Ensure the profile_role enum contains governance values used by the app.
-- Run this before setting profile.role to pf/cn/ca/admin.

alter type public.profile_role add value if not exists 'member';
alter type public.profile_role add value if not exists 'pf';
alter type public.profile_role add value if not exists 'cn';
alter type public.profile_role add value if not exists 'ca';
alter type public.profile_role add value if not exists 'admin';

-- Verification
select e.enumlabel
from pg_enum e
join pg_type t on t.oid = e.enumtypid
join pg_namespace n on n.oid = t.typnamespace
where n.nspname = 'public'
  and t.typname = 'profile_role'
order by e.enumsortorder;


-- ===================================================================
-- END sql/2026-02-22_extend_profile_role_enum.sql
-- ===================================================================

-- ===================================================================
-- BEGIN sql/2026-02-21_role_based_member_access.sql
-- ===================================================================
begin;

alter table public.member enable row level security;

create or replace function public.current_profile_role()
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  role_value text;
  has_profile_id boolean;
  has_profile_user_id boolean;
begin
  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profile'
      and column_name = 'user_id'
  )
  into has_profile_user_id;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profile'
      and column_name = 'id'
  )
  into has_profile_id;

  if has_profile_user_id then
    execute 'select p.role from public.profile p where p.user_id = auth.uid() limit 1'
      into role_value;
  elsif has_profile_id then
    execute 'select p.role from public.profile p where p.id = auth.uid() limit 1'
      into role_value;
  end if;

  role_value := lower(trim(coalesce(role_value, 'member')));
  if role_value = '' then
    return 'member';
  end if;

  return role_value;
end;
$$;

create or replace function public.current_member_region_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select m.region_id
  from public.member m
  where m.user_id = auth.uid()
  order by m.created_at desc nulls last
  limit 1;
$$;

grant execute on function public.current_profile_role() to authenticated;
grant execute on function public.current_member_region_id() to authenticated;

do $$
declare
  p record;
begin
  for p in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'member'
  loop
    execute format('drop policy if exists %I on public.member', p.policyname);
  end loop;
end;
$$;

create policy member_select_by_role
on public.member
for select
using (
  user_id = auth.uid()
  or public.current_profile_role() in ('member', 'admin', 'ca', 'cn', 'pf')
);

create policy member_insert_by_role
on public.member
for insert
with check (
  user_id = auth.uid()
  or public.current_profile_role() in ('admin', 'ca', 'cn')
  or (
    public.current_profile_role() = 'pf'
    and region_id = public.current_member_region_id()
  )
);

create policy member_update_by_role
on public.member
for update
using (
  user_id = auth.uid()
  or public.current_profile_role() in ('admin', 'ca', 'cn')
  or (
    public.current_profile_role() = 'pf'
    and region_id = public.current_member_region_id()
  )
)
with check (
  user_id = auth.uid()
  or public.current_profile_role() in ('admin', 'ca', 'cn')
  or (
    public.current_profile_role() = 'pf'
    and region_id = public.current_member_region_id()
  )
);

commit;


-- ===================================================================
-- END sql/2026-02-21_role_based_member_access.sql
-- ===================================================================

-- ===================================================================
-- BEGIN sql/2026-02-22_profile_role_governance_access.sql
-- ===================================================================
begin;

alter table public.profile enable row level security;

create or replace function public.current_profile_role()
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  role_value text;
  has_profile_id boolean;
  has_profile_user_id boolean;
begin
  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profile'
      and column_name = 'user_id'
  )
  into has_profile_user_id;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profile'
      and column_name = 'id'
  )
  into has_profile_id;

  if has_profile_user_id then
    execute 'select p.role::text from public.profile p where p.user_id = auth.uid() limit 1'
      into role_value;
  elsif has_profile_id then
    execute 'select p.role::text from public.profile p where p.id = auth.uid() limit 1'
      into role_value;
  end if;

  role_value := lower(trim(coalesce(role_value, 'member')));
  if role_value = '' then
    return 'member';
  end if;

  return role_value;
end;
$$;

grant execute on function public.current_profile_role() to authenticated;

do $$
declare
  p record;
  profile_auth_column text;
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profile'
      and column_name = 'user_id'
  ) then
    profile_auth_column := 'user_id';
  elsif exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profile'
      and column_name = 'id'
  ) then
    profile_auth_column := 'id';
  else
    raise exception 'public.profile must contain either user_id or id column for RLS.';
  end if;

  for p in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profile'
  loop
    execute format('drop policy if exists %I on public.profile', p.policyname);
  end loop;

  execute format(
    'create policy profile_select_by_role on public.profile for select using (%I = auth.uid() or public.current_profile_role() in (''admin'',''ca''))',
    profile_auth_column
  );

  execute format(
    'create policy profile_insert_self on public.profile for insert with check (%I = auth.uid())',
    profile_auth_column
  );

  execute format(
    'create policy profile_update_by_role on public.profile for update using (%I = auth.uid() or public.current_profile_role() in (''admin'',''ca'')) with check ((%I = auth.uid()) or (public.current_profile_role() = ''admin'' and lower(coalesce(role::text,''member'')) in (''member'',''pf'',''cn'',''ca'',''admin'')) or (public.current_profile_role() = ''ca'' and lower(coalesce(role::text,''member'')) in (''member'',''pf'',''cn'')))',
    profile_auth_column,
    profile_auth_column
  );
end $$;

commit;


-- ===================================================================
-- END sql/2026-02-22_profile_role_governance_access.sql
-- ===================================================================

-- ===================================================================
-- BEGIN sql/2026-02-23_communication_core.sql
-- ===================================================================
begin;

create extension if not exists pgcrypto;

alter table public.member enable row level security;

create or replace function public.current_profile_role()
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  role_value text;
  has_profile_id boolean;
  has_profile_user_id boolean;
begin
  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profile'
      and column_name = 'user_id'
  )
  into has_profile_user_id;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profile'
      and column_name = 'id'
  )
  into has_profile_id;

  if has_profile_user_id then
    execute 'select p.role::text from public.profile p where p.user_id = auth.uid() limit 1'
      into role_value;
  elsif has_profile_id then
    execute 'select p.role::text from public.profile p where p.id = auth.uid() limit 1'
      into role_value;
  end if;

  role_value := lower(trim(coalesce(role_value, 'member')));
  if role_value = '' then
    return 'member';
  end if;

  return role_value;
end;
$$;

create or replace function public.current_member_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select m.id
  from public.member m
  where m.user_id = auth.uid()
  order by m.created_at desc nulls last
  limit 1;
$$;

create or replace function public.current_member_region_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select m.region_id
  from public.member m
  where m.user_id = auth.uid()
  order by m.created_at desc nulls last
  limit 1;
$$;

create or replace function public.current_member_prefecture_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select m.prefecture_id
  from public.member m
  where m.user_id = auth.uid()
  order by m.created_at desc nulls last
  limit 1;
$$;

create or replace function public.current_member_commune_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select m.commune_id
  from public.member m
  where m.user_id = auth.uid()
  order by m.created_at desc nulls last
  limit 1;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'scope_level'
  ) then
    create type public.scope_level as enum ('all', 'region', 'prefecture', 'commune');
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'conversation_type'
  ) then
    create type public.conversation_type as enum ('community', 'direct');
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'email_campaign_status'
  ) then
    create type public.email_campaign_status as enum ('draft', 'queued', 'sent', 'failed');
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'email_recipient_status'
  ) then
    create type public.email_recipient_status as enum ('pending', 'sent', 'failed', 'skipped');
  end if;
end
$$;

create table if not exists public.communication_team (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  can_publish boolean not null default true,
  can_send_email boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.announcement (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  created_by uuid not null,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.announcement_scope (
  id uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references public.announcement(id) on delete cascade,
  scope_type public.scope_level not null default 'all',
  region_id uuid references public.region(id) on delete set null,
  prefecture_id uuid references public.prefecture(id) on delete set null,
  commune_id uuid references public.commune(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint announcement_scope_consistency check (
    (scope_type = 'all' and region_id is null and prefecture_id is null and commune_id is null)
    or (scope_type = 'region' and region_id is not null and prefecture_id is null and commune_id is null)
    or (scope_type = 'prefecture' and region_id is null and prefecture_id is not null and commune_id is null)
    or (scope_type = 'commune' and region_id is null and prefecture_id is null and commune_id is not null)
  )
);

create table if not exists public.conversation (
  id uuid primary key default gen_random_uuid(),
  conversation_type public.conversation_type not null,
  title text,
  created_by uuid not null,
  scope_type public.scope_level not null default 'all',
  region_id uuid references public.region(id) on delete set null,
  prefecture_id uuid references public.prefecture(id) on delete set null,
  commune_id uuid references public.commune(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversation_scope_consistency check (
    (conversation_type = 'direct' and scope_type = 'all' and region_id is null and prefecture_id is null and commune_id is null)
    or (
      conversation_type = 'community'
      and (
        (scope_type = 'all' and region_id is null and prefecture_id is null and commune_id is null)
        or (scope_type = 'region' and region_id is not null and prefecture_id is null and commune_id is null)
        or (scope_type = 'prefecture' and region_id is null and prefecture_id is not null and commune_id is null)
        or (scope_type = 'commune' and region_id is null and prefecture_id is null and commune_id is not null)
      )
    )
  )
);

create table if not exists public.conversation_participant (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversation(id) on delete cascade,
  member_id uuid not null references public.member(id) on delete cascade,
  can_post boolean not null default true,
  joined_at timestamptz not null default now(),
  unique (conversation_id, member_id)
);

create table if not exists public.message (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversation(id) on delete cascade,
  sender_member_id uuid not null references public.member(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.email_campaign (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  body text not null,
  audience_scope public.scope_level not null default 'all',
  region_id uuid references public.region(id) on delete set null,
  prefecture_id uuid references public.prefecture(id) on delete set null,
  commune_id uuid references public.commune(id) on delete set null,
  status public.email_campaign_status not null default 'draft',
  provider text,
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint email_campaign_scope_consistency check (
    (audience_scope = 'all' and region_id is null and prefecture_id is null and commune_id is null)
    or (audience_scope = 'region' and region_id is not null and prefecture_id is null and commune_id is null)
    or (audience_scope = 'prefecture' and region_id is null and prefecture_id is not null and commune_id is null)
    or (audience_scope = 'commune' and region_id is null and prefecture_id is null and commune_id is not null)
  )
);

create table if not exists public.email_campaign_recipient (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.email_campaign(id) on delete cascade,
  member_id uuid references public.member(id) on delete set null,
  recipient_email text not null,
  status public.email_recipient_status not null default 'pending',
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (campaign_id, recipient_email)
);

create index if not exists idx_announcement_scope_announcement_id
  on public.announcement_scope (announcement_id);

create index if not exists idx_announcement_scope_region
  on public.announcement_scope (region_id);

create index if not exists idx_announcement_scope_prefecture
  on public.announcement_scope (prefecture_id);

create index if not exists idx_announcement_scope_commune
  on public.announcement_scope (commune_id);

create index if not exists idx_conversation_type_created_at
  on public.conversation (conversation_type, created_at desc);

create index if not exists idx_conversation_participant_member
  on public.conversation_participant (member_id, conversation_id);

create index if not exists idx_message_conversation_created_at
  on public.message (conversation_id, created_at desc);

create index if not exists idx_email_campaign_scope_status
  on public.email_campaign (audience_scope, status, created_at desc);

create index if not exists idx_email_campaign_recipient_campaign
  on public.email_campaign_recipient (campaign_id, status);

create or replace function public.scope_matches_member(
  scope_kind public.scope_level,
  scope_region_id uuid,
  scope_prefecture_id uuid,
  scope_commune_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when scope_kind = 'all' then true
    when scope_kind = 'region' then scope_region_id = public.current_member_region_id()
    when scope_kind = 'prefecture' then scope_prefecture_id = public.current_member_prefecture_id()
    when scope_kind = 'commune' then scope_commune_id = public.current_member_commune_id()
    else false
  end;
$$;

create or replace function public.is_communication_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.current_profile_role() in ('admin', 'ca', 'cn', 'pf')
    or exists (
      select 1
      from public.communication_team ct
      where ct.user_id = auth.uid()
        and (ct.can_publish = true or ct.can_send_email = true)
    );
$$;

create or replace function public.can_read_announcement_scope(
  announcement_uuid uuid,
  scope_kind public.scope_level,
  scope_region_id uuid,
  scope_prefecture_id uuid,
  scope_commune_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_communication_manager()
    or (
      exists (
        select 1
        from public.announcement a
        where a.id = announcement_uuid
          and a.is_published = true
      )
      and public.scope_matches_member(
        scope_kind,
        scope_region_id,
        scope_prefecture_id,
        scope_commune_id
      )
    );
$$;

create or replace function public.can_access_conversation(conversation_uuid uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  conversation_row record;
  member_uuid uuid;
begin
  member_uuid := public.current_member_id();
  if member_uuid is null then
    return false;
  end if;

  select
    c.conversation_type,
    c.scope_type,
    c.region_id,
    c.prefecture_id,
    c.commune_id
  into conversation_row
  from public.conversation c
  where c.id = conversation_uuid;

  if not found then
    return false;
  end if;

  if conversation_row.conversation_type = 'community' then
    return public.scope_matches_member(
      conversation_row.scope_type,
      conversation_row.region_id,
      conversation_row.prefecture_id,
      conversation_row.commune_id
    );
  end if;

  return exists (
    select 1
    from public.conversation_participant cp
    where cp.conversation_id = conversation_uuid
      and cp.member_id = member_uuid
  );
end;
$$;

create or replace function public.can_post_conversation(
  conversation_uuid uuid,
  sender_member_uuid uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  conversation_kind public.conversation_type;
begin
  if sender_member_uuid is null then
    return false;
  end if;

  if sender_member_uuid <> public.current_member_id() then
    return false;
  end if;

  select c.conversation_type
  into conversation_kind
  from public.conversation c
  where c.id = conversation_uuid;

  if not found then
    return false;
  end if;

  if conversation_kind = 'community' then
    return public.can_access_conversation(conversation_uuid);
  end if;

  return exists (
    select 1
    from public.conversation_participant cp
    where cp.conversation_id = conversation_uuid
      and cp.member_id = sender_member_uuid
      and cp.can_post = true
  );
end;
$$;

grant execute on function public.current_profile_role() to authenticated;
grant execute on function public.current_member_id() to authenticated;
grant execute on function public.current_member_region_id() to authenticated;
grant execute on function public.current_member_prefecture_id() to authenticated;
grant execute on function public.current_member_commune_id() to authenticated;
grant execute on function public.scope_matches_member(public.scope_level, uuid, uuid, uuid) to authenticated;
grant execute on function public.is_communication_manager() to authenticated;
grant execute on function public.can_read_announcement_scope(uuid, public.scope_level, uuid, uuid, uuid) to authenticated;
grant execute on function public.can_access_conversation(uuid) to authenticated;
grant execute on function public.can_post_conversation(uuid, uuid) to authenticated;

alter table public.communication_team enable row level security;
alter table public.announcement enable row level security;
alter table public.announcement_scope enable row level security;
alter table public.conversation enable row level security;
alter table public.conversation_participant enable row level security;
alter table public.message enable row level security;
alter table public.email_campaign enable row level security;
alter table public.email_campaign_recipient enable row level security;

do $$
declare
  table_name text;
  policy_name text;
begin
  foreach table_name in array array[
    'communication_team',
    'announcement',
    'announcement_scope',
    'conversation',
    'conversation_participant',
    'message',
    'email_campaign',
    'email_campaign_recipient'
  ]
  loop
    for policy_name in
      select p.policyname
      from pg_policies p
      where p.schemaname = 'public'
        and p.tablename = table_name
    loop
      execute format('drop policy if exists %I on public.%I', policy_name, table_name);
    end loop;
  end loop;
end
$$;

create policy communication_team_select
on public.communication_team
for select
using (
  user_id = auth.uid()
  or public.current_profile_role() in ('admin', 'ca')
);

create policy communication_team_manage
on public.communication_team
for all
using (public.current_profile_role() in ('admin', 'ca'))
with check (public.current_profile_role() in ('admin', 'ca'));

create policy announcement_select
on public.announcement
for select
using (
  is_published = true
  and exists (
    select 1
    from public.announcement_scope s
    where s.announcement_id = announcement.id
      and public.scope_matches_member(
        s.scope_type,
        s.region_id,
        s.prefecture_id,
        s.commune_id
      )
  )
);

create policy announcement_manage
on public.announcement
for all
using (public.is_communication_manager())
with check (public.is_communication_manager());

create policy announcement_scope_select
on public.announcement_scope
for select
using (
  public.can_read_announcement_scope(
    announcement_scope.announcement_id,
    announcement_scope.scope_type,
    announcement_scope.region_id,
    announcement_scope.prefecture_id,
    announcement_scope.commune_id
  )
);

create policy announcement_scope_manage
on public.announcement_scope
for all
using (public.is_communication_manager())
with check (public.is_communication_manager());

create policy conversation_select
on public.conversation
for select
using (public.can_access_conversation(id));

create policy conversation_insert
on public.conversation
for insert
with check (
  (
    conversation_type = 'direct'
    and created_by = auth.uid()
  )
  or (
    conversation_type = 'community'
    and public.is_communication_manager()
  )
);

create policy conversation_update_delete
on public.conversation
for update
using (
  (conversation_type = 'direct' and created_by = auth.uid())
  or (conversation_type = 'community' and public.is_communication_manager())
)
with check (
  (conversation_type = 'direct' and created_by = auth.uid())
  or (conversation_type = 'community' and public.is_communication_manager())
);

create policy conversation_delete
on public.conversation
for delete
using (
  (conversation_type = 'direct' and created_by = auth.uid())
  or (conversation_type = 'community' and public.is_communication_manager())
);

create policy conversation_participant_select
on public.conversation_participant
for select
using (public.can_access_conversation(conversation_id));

create policy conversation_participant_insert
on public.conversation_participant
for insert
with check (
  exists (
    select 1
    from public.conversation c
    where c.id = conversation_participant.conversation_id
      and (
        (c.conversation_type = 'direct' and c.created_by = auth.uid())
        or (c.conversation_type = 'community' and public.is_communication_manager())
      )
  )
);

create policy conversation_participant_update_delete
on public.conversation_participant
for update
using (
  exists (
    select 1
    from public.conversation c
    where c.id = conversation_participant.conversation_id
      and (
        (c.conversation_type = 'direct' and c.created_by = auth.uid())
        or (c.conversation_type = 'community' and public.is_communication_manager())
      )
  )
)
with check (
  exists (
    select 1
    from public.conversation c
    where c.id = conversation_participant.conversation_id
      and (
        (c.conversation_type = 'direct' and c.created_by = auth.uid())
        or (c.conversation_type = 'community' and public.is_communication_manager())
      )
  )
);

create policy conversation_participant_delete
on public.conversation_participant
for delete
using (
  exists (
    select 1
    from public.conversation c
    where c.id = conversation_participant.conversation_id
      and (
        (c.conversation_type = 'direct' and c.created_by = auth.uid())
        or (c.conversation_type = 'community' and public.is_communication_manager())
      )
  )
);

create policy message_select
on public.message
for select
using (public.can_access_conversation(conversation_id));

create policy message_insert
on public.message
for insert
with check (public.can_post_conversation(conversation_id, sender_member_id));

create policy message_update
on public.message
for update
using (
  sender_member_id = public.current_member_id()
  and deleted_at is null
)
with check (
  sender_member_id = public.current_member_id()
);

create policy message_delete
on public.message
for delete
using (
  sender_member_id = public.current_member_id()
  or public.is_communication_manager()
);

create policy email_campaign_manage
on public.email_campaign
for all
using (public.is_communication_manager())
with check (public.is_communication_manager());

create policy email_campaign_recipient_manage
on public.email_campaign_recipient
for all
using (
  exists (
    select 1
    from public.email_campaign c
    where c.id = email_campaign_recipient.campaign_id
      and public.is_communication_manager()
  )
)
with check (
  exists (
    select 1
    from public.email_campaign c
    where c.id = email_campaign_recipient.campaign_id
      and public.is_communication_manager()
  )
);

commit;


-- ===================================================================
-- END sql/2026-02-23_communication_core.sql
-- ===================================================================

-- ===================================================================
-- BEGIN sql/2026-02-23_fix_announcement_scope_recursion.sql
-- ===================================================================
begin;

create or replace function public.can_read_announcement_scope(
  announcement_uuid uuid,
  scope_kind public.scope_level,
  scope_region_id uuid,
  scope_prefecture_id uuid,
  scope_commune_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_communication_manager()
    or (
      exists (
        select 1
        from public.announcement a
        where a.id = announcement_uuid
          and a.is_published = true
      )
      and public.scope_matches_member(
        scope_kind,
        scope_region_id,
        scope_prefecture_id,
        scope_commune_id
      )
    );
$$;

grant execute on function public.can_read_announcement_scope(uuid, public.scope_level, uuid, uuid, uuid) to authenticated;

do $$
begin
  if to_regclass('public.announcement_scope') is not null then
    execute 'drop policy if exists announcement_scope_select on public.announcement_scope';
    execute '
      create policy announcement_scope_select
      on public.announcement_scope
      for select
      using (
        public.can_read_announcement_scope(
          announcement_scope.announcement_id,
          announcement_scope.scope_type,
          announcement_scope.region_id,
          announcement_scope.prefecture_id,
          announcement_scope.commune_id
        )
      )
    ';
  end if;
end
$$;

commit;


-- ===================================================================
-- END sql/2026-02-23_fix_announcement_scope_recursion.sql
-- ===================================================================

-- ===================================================================
-- BEGIN sql/2026-02-23_allow_pf_cn_communication.sql
-- ===================================================================
begin;

create or replace function public.is_communication_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.current_profile_role() in ('admin', 'ca', 'cn', 'pf')
    or exists (
      select 1
      from public.communication_team ct
      where ct.user_id = auth.uid()
        and (ct.can_publish = true or ct.can_send_email = true)
    );
$$;

grant execute on function public.is_communication_manager() to authenticated;

commit;


-- ===================================================================
-- END sql/2026-02-23_allow_pf_cn_communication.sql
-- ===================================================================

-- ===================================================================
-- BEGIN sql/2026-02-23_member_orientation_foundation.sql
-- ===================================================================
begin;

alter table public.member
  add column if not exists cellule_primary text;

alter table public.member
  add column if not exists cellule_secondary text;

update public.member
set cellule_primary = case
  when lower(join_mode::text) = 'enterprise' then 'entrepreneur'
  when lower(join_mode::text) = 'association' then 'org_leader'
  else 'engaged'
end
where cellule_primary is null;

alter table public.member
  alter column cellule_primary set default 'engaged';

alter table public.member
  alter column cellule_primary set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'member_cellule_primary_check'
      and conrelid = 'public.member'::regclass
  ) then
    alter table public.member
      add constraint member_cellule_primary_check
      check (cellule_primary in ('engaged', 'entrepreneur', 'org_leader'));
  end if;
end
$$;

update public.member
set status = 'pending'
where status is null;

alter table public.member
  alter column status set default 'pending';

alter table public.member
  alter column status set not null;

commit;

select
  c.column_name,
  c.is_nullable,
  c.column_default
from information_schema.columns c
where c.table_schema = 'public'
  and c.table_name = 'member'
  and c.column_name in ('cellule_primary', 'status')
order by c.column_name;


-- ===================================================================
-- END sql/2026-02-23_member_orientation_foundation.sql
-- ===================================================================

-- ===================================================================
-- BEGIN sql/2026-02-23_member_orientation_conditional_checks.sql
-- ===================================================================
begin;

alter table public.member
  add column if not exists gender text,
  add column if not exists birth_date date,
  add column if not exists age_range text,
  add column if not exists education_level text,
  add column if not exists occupation_status text,
  add column if not exists profession_title text,
  add column if not exists locality text,
  add column if not exists mobility boolean,
  add column if not exists mobility_zones text,
  add column if not exists engagement_domains text[],
  add column if not exists engagement_frequency text,
  add column if not exists engagement_recent_action text,
  add column if not exists business_stage text,
  add column if not exists business_sector text,
  add column if not exists business_needs text[],
  add column if not exists org_role text,
  add column if not exists org_name_declared text,
  add column if not exists skills jsonb,
  add column if not exists interests text[],
  add column if not exists odd_priorities int[],
  add column if not exists goal_3_6_months text,
  add column if not exists support_types text[],
  add column if not exists availability text,
  add column if not exists contact_preference text,
  add column if not exists consent_terms boolean default false,
  add column if not exists consent_analytics boolean default false,
  add column if not exists consent_ai_training_agg boolean default false,
  add column if not exists partner_request boolean default false,
  add column if not exists org_type text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'member_cellule_secondary_check'
      and conrelid = 'public.member'::regclass
  ) then
    alter table public.member
      add constraint member_cellule_secondary_check
      check (
        cellule_secondary is null
        or cellule_secondary in ('engaged', 'entrepreneur', 'org_leader')
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'member_cellule_secondary_distinct_check'
      and conrelid = 'public.member'::regclass
  ) then
    alter table public.member
      add constraint member_cellule_secondary_distinct_check
      check (
        cellule_secondary is null
        or cellule_primary is null
        or cellule_secondary <> cellule_primary
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'member_contact_preference_check'
      and conrelid = 'public.member'::regclass
  ) then
    alter table public.member
      add constraint member_contact_preference_check
      check (
        contact_preference is null
        or contact_preference in ('whatsapp', 'email', 'call')
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'member_org_type_check'
      and conrelid = 'public.member'::regclass
  ) then
    alter table public.member
      add constraint member_org_type_check
      check (
        org_type is null
        or org_type in ('association', 'enterprise')
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'member_odd_priorities_check'
      and conrelid = 'public.member'::regclass
  ) then
    alter table public.member
      add constraint member_odd_priorities_check
      check (
        odd_priorities is null
        or (
          cardinality(odd_priorities) between 1 and 3
          and odd_priorities <@ array[1, 2, 3, 4, 5, 6, 8, 13, 16]::int[]
        )
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'member_partner_request_requires_org_check'
      and conrelid = 'public.member'::regclass
  ) then
    alter table public.member
      add constraint member_partner_request_requires_org_check
      check (
        coalesce(partner_request, false) = false
        or (
          org_type in ('association', 'enterprise')
          and nullif(trim(coalesce(org_name, '')), '') is not null
        )
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'member_active_profile_requirements_check'
      and conrelid = 'public.member'::regclass
  ) then
    alter table public.member
      add constraint member_active_profile_requirements_check
      check (
        status::text <> 'active'
        or (
          nullif(trim(coalesce(education_level, '')), '') is not null
          and nullif(trim(coalesce(occupation_status, '')), '') is not null
          and (
            birth_date is not null
            or nullif(trim(coalesce(age_range, '')), '') is not null
          )
          and nullif(trim(coalesce(contact_preference, '')), '') is not null
          and contact_preference in ('whatsapp', 'email', 'call')
          and coalesce(consent_terms, false) = true
          and skills is not null
          and jsonb_typeof(skills) = 'array'
          and jsonb_array_length(skills) > 0
          and interests is not null
          and cardinality(interests) > 0
          and odd_priorities is not null
          and cardinality(odd_priorities) between 1 and 3
          and odd_priorities <@ array[1, 2, 3, 4, 5, 6, 8, 13, 16]::int[]
          and nullif(trim(coalesce(goal_3_6_months, '')), '') is not null
          and support_types is not null
          and cardinality(support_types) > 0
          and case
            when cellule_primary = 'engaged' then
              engagement_domains is not null
              and cardinality(engagement_domains) > 0
              and nullif(trim(coalesce(engagement_frequency, '')), '') is not null
              and nullif(trim(coalesce(engagement_recent_action, '')), '') is not null
            when cellule_primary = 'entrepreneur' then
              nullif(trim(coalesce(business_stage, '')), '') is not null
              and nullif(trim(coalesce(business_sector, '')), '') is not null
              and business_needs is not null
              and cardinality(business_needs) > 0
            when cellule_primary = 'org_leader' then
              nullif(trim(coalesce(org_role, '')), '') is not null
              and nullif(trim(coalesce(org_name_declared, '')), '') is not null
            else false
          end
        )
      );
  end if;
end
$$;

commit;

select
  c.column_name,
  c.data_type,
  c.is_nullable,
  c.column_default
from information_schema.columns c
where c.table_schema = 'public'
  and c.table_name = 'member'
  and c.column_name in (
    'cellule_primary',
    'cellule_secondary',
    'education_level',
    'occupation_status',
    'contact_preference',
    'consent_terms',
    'odd_priorities',
    'goal_3_6_months',
    'support_types',
    'status'
  )
order by c.column_name;

select
  conname,
  contype
from pg_constraint
where conrelid = 'public.member'::regclass
  and conname in (
    'member_cellule_secondary_check',
    'member_cellule_secondary_distinct_check',
    'member_contact_preference_check',
    'member_org_type_check',
    'member_odd_priorities_check',
    'member_partner_request_requires_org_check',
    'member_active_profile_requirements_check'
  )
order by conname;


-- ===================================================================
-- END sql/2026-02-23_member_orientation_conditional_checks.sql
-- ===================================================================
