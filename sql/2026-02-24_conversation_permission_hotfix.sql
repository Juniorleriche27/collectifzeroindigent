begin;

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
  if auth.uid() is null then
    return 'member';
  end if;

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
    execute 'select p.role::text from public.profile p where p.user_id = auth.uid() and p.role is not null limit 1'
      into role_value;
  end if;

  if role_value is null and has_profile_id then
    execute 'select p.role::text from public.profile p where p.id = auth.uid() and p.role is not null limit 1'
      into role_value;
  end if;

  role_value := lower(trim(coalesce(role_value, 'member')));
  if role_value = '' then
    return 'member';
  end if;

  return role_value;
end;
$$;

create or replace function public.can_access_conversation(conversation_uuid uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  conversation_kind public.conversation_type;
  current_member_uuid uuid;
begin
  if auth.uid() is null then
    return false;
  end if;

  select c.conversation_type
  into conversation_kind
  from public.conversation c
  where c.id = conversation_uuid;

  if conversation_kind is null then
    return false;
  end if;

  if conversation_kind = 'community' then
    return true;
  end if;

  current_member_uuid := public.current_member_id();
  if current_member_uuid is null then
    return false;
  end if;

  return exists (
    select 1
    from public.conversation_participant cp
    where cp.conversation_id = conversation_uuid
      and cp.member_id = current_member_uuid
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
  current_member_uuid uuid;
  can_participate boolean;
begin
  if auth.uid() is null then
    return false;
  end if;

  current_member_uuid := public.current_member_id();
  if current_member_uuid is null or current_member_uuid <> sender_member_uuid then
    return false;
  end if;

  select c.conversation_type
  into conversation_kind
  from public.conversation c
  where c.id = conversation_uuid;

  if conversation_kind is null then
    return false;
  end if;

  if conversation_kind = 'community' then
    return true;
  end if;

  select cp.can_post
  into can_participate
  from public.conversation_participant cp
  where cp.conversation_id = conversation_uuid
    and cp.member_id = current_member_uuid
  limit 1;

  return coalesce(can_participate, false);
end;
$$;

drop policy if exists conversation_insert on public.conversation;
create policy conversation_insert
on public.conversation
for insert
with check (
  created_by = auth.uid()
  and (
    conversation_type = 'direct'
    or conversation_type = 'community'
  )
);

drop policy if exists conversation_update_delete on public.conversation;
create policy conversation_update_delete
on public.conversation
for update
using (
  created_by = auth.uid()
  or public.is_communication_manager()
)
with check (
  created_by = auth.uid()
  or public.is_communication_manager()
);

drop policy if exists conversation_delete on public.conversation;
create policy conversation_delete
on public.conversation
for delete
using (
  created_by = auth.uid()
  or public.is_communication_manager()
);

grant execute on function public.current_profile_role() to authenticated;
grant execute on function public.can_access_conversation(uuid) to authenticated;
grant execute on function public.can_post_conversation(uuid, uuid) to authenticated;

do $$
declare
  owner_email constant text := 'ylamadokou@gmail.com';
  owner_user_uuid uuid;
begin
  select m.user_id
  into owner_user_uuid
  from public.member m
  where lower(trim(coalesce(m.email, ''))) = owner_email
  order by m.created_at desc nulls last
  limit 1;

  if owner_user_uuid is null then
    raise notice 'Aucun membre trouve pour %.', owner_email;
    return;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profile'
      and column_name = 'user_id'
  ) then
    update public.profile
    set role = 'admin'
    where user_id = owner_user_uuid;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profile'
      and column_name = 'id'
  ) then
    update public.profile
    set role = 'admin'
    where id = owner_user_uuid;
  end if;
end
$$;

commit;

select
  tablename,
  policyname,
  permissive,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'conversation'
  and policyname in ('conversation_insert', 'conversation_update_delete', 'conversation_delete')
order by policyname;

select
  proname
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and proname in ('current_profile_role', 'can_access_conversation', 'can_post_conversation')
order by proname;

with owner as (
  select m.user_id, m.email
  from public.member m
  where lower(trim(coalesce(m.email, ''))) = 'ylamadokou@gmail.com'
  order by m.created_at desc nulls last
  limit 1
)
select
  owner.user_id,
  owner.email,
  (
    select string_agg(distinct p.role::text, ', ' order by p.role::text)
    from public.profile p
    where (to_jsonb(p) ->> 'user_id') = owner.user_id::text
       or (to_jsonb(p) ->> 'id') = owner.user_id::text
  ) as profile_roles
from owner;
