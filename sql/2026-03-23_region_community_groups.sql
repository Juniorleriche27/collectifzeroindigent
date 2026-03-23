-- Important:
-- 1. Execute sql/2026-03-23_region_community_kind_enum.sql first.
-- 2. Then execute this file in a second query.

begin;

create or replace function public.enforce_conversation_structure()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  parent_row record;
begin
  if new.conversation_type = 'direct' then
    new.community_kind := null;
    new.parent_conversation_id := null;
    new.scope_type := 'all';
    new.region_id := null;
    new.prefecture_id := null;
    new.commune_id := null;
    return new;
  end if;

  if new.community_kind is null then
    raise exception 'community_kind is required for community conversations';
  end if;

  if new.parent_conversation_id is null then
    if new.community_kind = 'region' then
      new.scope_type := 'region';
      if new.region_id is null then
        raise exception 'region_id is required for region community';
      end if;
      new.prefecture_id := null;
      new.commune_id := null;
      return new;
    end if;

    new.scope_type := 'all';
    new.region_id := null;
    new.prefecture_id := null;
    new.commune_id := null;
    return new;
  end if;

  select
    c.id,
    c.conversation_type,
    c.parent_conversation_id,
    c.community_kind
  into parent_row
  from public.conversation c
  where c.id = new.parent_conversation_id;

  if not found then
    raise exception 'parent conversation not found';
  end if;

  if parent_row.conversation_type <> 'community' then
    raise exception 'parent conversation must be a community';
  end if;

  if parent_row.parent_conversation_id is not null then
    raise exception 'nested sub-communities deeper than 1 level are not allowed';
  end if;

  if parent_row.community_kind is null then
    raise exception 'parent community_kind is missing';
  end if;

  if parent_row.community_kind = 'czi' then
    raise exception 'cannot create sub-community inside Communaute CZI';
  end if;

  if parent_row.community_kind = 'region' then
    raise exception 'cannot create sub-community inside region community';
  end if;

  if parent_row.community_kind <> new.community_kind then
    raise exception 'sub-community must use the same community_kind as its parent';
  end if;

  new.scope_type := 'all';
  new.region_id := null;
  new.prefecture_id := null;
  new.commune_id := null;

  return new;
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

  if target_kind = 'region' then
    return public.current_member_region_id() is not null;
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
  conversation_scope public.scope_level;
  scope_region_uuid uuid;
  scope_prefecture_uuid uuid;
  scope_commune_uuid uuid;
  actor_role text;
begin
  if auth.uid() is null then
    return false;
  end if;

  current_member_uuid := public.current_member_id();
  if current_member_uuid is null then
    return false;
  end if;

  select
    c.conversation_type,
    c.community_kind,
    c.created_by,
    c.parent_conversation_id,
    c.scope_type,
    c.region_id,
    c.prefecture_id,
    c.commune_id
  into
    conversation_kind,
    community_kind,
    conversation_creator,
    parent_conversation_uuid,
    conversation_scope,
    scope_region_uuid,
    scope_prefecture_uuid,
    scope_commune_uuid
  from public.conversation c
  where c.id = conversation_uuid;

  if conversation_kind is null then
    return false;
  end if;

  if conversation_kind = 'community' then
    if community_kind = 'region' then
      actor_role := lower(trim(coalesce(public.current_profile_role(), '')));
      if public.is_communication_manager() then
        return true;
      end if;
      if actor_role in ('admin', 'ca', 'cn') then
        return true;
      end if;
      return public.scope_matches_member(
        conversation_scope,
        scope_region_uuid,
        scope_prefecture_uuid,
        scope_commune_uuid
      );
    end if;

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
    if community_kind = 'region' then
      return public.can_access_conversation(conversation_uuid);
    end if;
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

grant execute on function public.member_in_community_kind(public.conversation_community_kind) to authenticated;
grant execute on function public.can_access_conversation(uuid) to authenticated;
grant execute on function public.can_post_conversation(uuid, uuid) to authenticated;

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
    or (
      conversation_type = 'community'
      and parent_conversation_id is null
      and community_kind = 'region'
      and scope_type = 'region'
      and region_id is not null
      and prefecture_id is null
      and commune_id is null
      and (
        public.is_communication_manager()
        or lower(trim(coalesce(public.current_profile_role(), ''))) in ('admin', 'ca', 'cn')
      )
    )
  )
);

do $$
declare
  seed_creator uuid;
  region_row record;
  regional_root_id uuid;
begin
  select m.user_id
  into seed_creator
  from public.member m
  where m.user_id is not null
  order by m.created_at asc nulls last
  limit 1;

  if seed_creator is null then
    seed_creator := '00000000-0000-0000-0000-000000000000'::uuid;
  end if;

  for region_row in
    select r.id, r.name
    from public.region r
    order by r.name asc
  loop
    select c.id
    into regional_root_id
    from public.conversation c
    where c.conversation_type = 'community'
      and c.parent_conversation_id is null
      and c.community_kind = 'region'
      and c.scope_type = 'region'
      and c.region_id = region_row.id
    order by c.created_at asc nulls last
    limit 1;

    if regional_root_id is null then
      insert into public.conversation (
        id,
        conversation_type,
        title,
        created_by,
        scope_type,
        region_id,
        prefecture_id,
        commune_id,
        community_kind,
        parent_conversation_id
      )
      values (
        gen_random_uuid(),
        'community',
        'Groupe regional : ' || region_row.name,
        seed_creator,
        'region',
        region_row.id,
        null,
        null,
        'region',
        null
      );
    else
      update public.conversation
      set
        title = 'Groupe regional : ' || region_row.name,
        scope_type = 'region',
        region_id = region_row.id,
        prefecture_id = null,
        commune_id = null,
        parent_conversation_id = null,
        community_kind = 'region'
      where id = regional_root_id;
    end if;
  end loop;
end
$$;

commit;

select
  c.id,
  c.title,
  c.region_id,
  c.community_kind,
  c.scope_type
from public.conversation c
where c.conversation_type = 'community'
  and c.parent_conversation_id is null
  and c.community_kind = 'region'
order by c.title asc;
