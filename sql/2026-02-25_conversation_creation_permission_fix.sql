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

create or replace function public.member_in_community_kind(
  target_kind public.conversation_community_kind
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  primary_cellule text;
  secondary_cellule text;
  expected_cellule text;
begin
  if auth.uid() is null then
    return false;
  end if;

  if public.is_communication_manager() then
    return true;
  end if;

  if target_kind = 'czi' then
    return public.current_member_id() is not null;
  end if;

  select
    lower(trim(coalesce(m.cellule_primary, ''))),
    lower(trim(coalesce(m.cellule_secondary, '')))
  into primary_cellule, secondary_cellule
  from public.member m
  where m.user_id = auth.uid()
  order by m.created_at desc nulls last
  limit 1;

  if primary_cellule is null and secondary_cellule is null then
    return false;
  end if;

  expected_cellule := case target_kind
    when 'engaged' then 'engaged'
    when 'entrepreneur' then 'entrepreneur'
    when 'org_leader' then 'org_leader'
    else ''
  end;

  return primary_cellule = expected_cellule
    or secondary_cellule = expected_cellule;
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
  community_kind public.conversation_community_kind;
  conversation_creator uuid;
  parent_conversation_uuid uuid;
  current_member_uuid uuid;
begin
  if auth.uid() is null then
    return false;
  end if;

  current_member_uuid := public.current_member_id();
  if current_member_uuid is null then
    return false;
  end if;

  select c.conversation_type, c.community_kind, c.created_by, c.parent_conversation_id
  into conversation_kind, community_kind, conversation_creator, parent_conversation_uuid
  from public.conversation c
  where c.id = conversation_uuid;

  if conversation_kind is null then
    return false;
  end if;

  if conversation_kind = 'community' then
    if parent_conversation_uuid is null then
      return true;
    end if;
    return public.member_in_community_kind(community_kind);
  end if;

  return conversation_creator = auth.uid()
    or exists (
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
  community_kind public.conversation_community_kind;
  parent_conversation_uuid uuid;
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

  select c.conversation_type, c.community_kind, c.parent_conversation_id
  into conversation_kind, community_kind, parent_conversation_uuid
  from public.conversation c
  where c.id = conversation_uuid;

  if conversation_kind is null then
    return false;
  end if;

  if conversation_kind = 'community' then
    if parent_conversation_uuid is null and community_kind <> 'czi' then
      return public.member_in_community_kind(community_kind);
    end if;
    return public.can_access_conversation(conversation_uuid);
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
    (
      conversation_type = 'direct'
      and community_kind is null
      and parent_conversation_id is null
    )
    or (
      conversation_type = 'community'
      and parent_conversation_id is not null
      and community_kind in ('engaged', 'entrepreneur', 'org_leader')
      and public.member_in_community_kind(community_kind)
      and exists (
        select 1
        from public.conversation parent
        where parent.id = conversation.parent_conversation_id
          and parent.conversation_type = 'community'
          and parent.parent_conversation_id is null
          and parent.community_kind = conversation.community_kind
          and parent.community_kind in ('engaged', 'entrepreneur', 'org_leader')
      )
    )
  )
);

grant execute on function public.current_profile_role() to authenticated;
grant execute on function public.member_in_community_kind(public.conversation_community_kind) to authenticated;
grant execute on function public.can_access_conversation(uuid) to authenticated;
grant execute on function public.can_post_conversation(uuid, uuid) to authenticated;

commit;

select
  tablename,
  policyname,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'conversation'
  and policyname in ('conversation_select', 'conversation_insert', 'conversation_update_delete', 'conversation_delete')
order by policyname;

select
  proname
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and proname in ('current_profile_role', 'member_in_community_kind', 'can_access_conversation', 'can_post_conversation')
order by proname;
