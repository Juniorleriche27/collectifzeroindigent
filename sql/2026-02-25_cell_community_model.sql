begin;

create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'conversation_community_kind'
  ) then
    create type public.conversation_community_kind as enum (
      'czi',
      'engaged',
      'entrepreneur',
      'org_leader'
    );
  end if;
end
$$;

alter table public.conversation
  add column if not exists community_kind public.conversation_community_kind,
  add column if not exists parent_conversation_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'conversation_parent_conversation_fk'
  ) then
    alter table public.conversation
      add constraint conversation_parent_conversation_fk
      foreign key (parent_conversation_id)
      references public.conversation(id)
      on delete cascade;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'conversation_kind_parent_consistency'
  ) then
    alter table public.conversation
      add constraint conversation_kind_parent_consistency
      check (
        (
          conversation_type = 'direct'
          and community_kind is null
          and parent_conversation_id is null
        )
        or (
          conversation_type = 'community'
          and community_kind is not null
        )
      );
  end if;
end
$$;

create index if not exists idx_conversation_parent_conversation_id
  on public.conversation (parent_conversation_id);

create index if not exists idx_conversation_kind_parent
  on public.conversation (community_kind, parent_conversation_id);

update public.conversation
set
  community_kind = 'czi',
  scope_type = 'all',
  region_id = null,
  prefecture_id = null,
  commune_id = null
where conversation_type = 'community'
  and community_kind is null;

update public.conversation
set
  community_kind = null,
  parent_conversation_id = null,
  scope_type = 'all',
  region_id = null,
  prefecture_id = null,
  commune_id = null
where conversation_type = 'direct';

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

  new.scope_type := 'all';
  new.region_id := null;
  new.prefecture_id := null;
  new.commune_id := null;

  if new.parent_conversation_id is null then
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

  if parent_row.community_kind <> new.community_kind then
    raise exception 'sub-community must use the same community_kind as its parent';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_conversation_structure on public.conversation;
create trigger trg_enforce_conversation_structure
before insert or update on public.conversation
for each row
execute function public.enforce_conversation_structure();

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

  select c.conversation_type, c.community_kind, c.parent_conversation_id
  into conversation_kind, community_kind, parent_conversation_uuid
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

grant execute on function public.member_in_community_kind(public.conversation_community_kind) to authenticated;
grant execute on function public.can_access_conversation(uuid) to authenticated;
grant execute on function public.can_post_conversation(uuid, uuid) to authenticated;

drop policy if exists conversation_select on public.conversation;
create policy conversation_select
on public.conversation
for select
using (public.can_access_conversation(id));

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

drop policy if exists conversation_update_delete on public.conversation;
create policy conversation_update_delete
on public.conversation
for update
using (
  public.is_communication_manager()
  or (
    created_by = auth.uid()
    and (
      conversation_type = 'direct'
      or parent_conversation_id is not null
    )
  )
)
with check (
  public.is_communication_manager()
  or (
    created_by = auth.uid()
    and (
      conversation_type = 'direct'
      or parent_conversation_id is not null
    )
  )
);

drop policy if exists conversation_delete on public.conversation;
create policy conversation_delete
on public.conversation
for delete
using (
  public.is_communication_manager()
  or (
    created_by = auth.uid()
    and (
      conversation_type = 'direct'
      or parent_conversation_id is not null
    )
  )
);

do $$
declare
  seed_creator uuid;
  root_czi uuid;
  root_engaged uuid;
  root_entrepreneur uuid;
  root_org_leader uuid;
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

  select c.id
  into root_czi
  from public.conversation c
  where c.conversation_type = 'community'
    and c.parent_conversation_id is null
    and c.community_kind = 'czi'
  order by c.created_at asc nulls last
  limit 1;

  if root_czi is null then
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
      'Communaute CZI',
      seed_creator,
      'all',
      null,
      null,
      null,
      'czi',
      null
    )
    returning id into root_czi;
  else
    update public.conversation
    set
      title = 'Communaute CZI',
      scope_type = 'all',
      region_id = null,
      prefecture_id = null,
      commune_id = null,
      parent_conversation_id = null,
      community_kind = 'czi'
    where id = root_czi;
  end if;

  select c.id
  into root_engaged
  from public.conversation c
  where c.conversation_type = 'community'
    and c.parent_conversation_id is null
    and c.community_kind = 'engaged'
  order by c.created_at asc nulls last
  limit 1;

  if root_engaged is null then
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
      'Cellule des jeunes engages',
      seed_creator,
      'all',
      null,
      null,
      null,
      'engaged',
      null
    );
  else
    update public.conversation
    set
      title = 'Cellule des jeunes engages',
      scope_type = 'all',
      region_id = null,
      prefecture_id = null,
      commune_id = null,
      parent_conversation_id = null,
      community_kind = 'engaged'
    where id = root_engaged;
  end if;

  select c.id
  into root_entrepreneur
  from public.conversation c
  where c.conversation_type = 'community'
    and c.parent_conversation_id is null
    and c.community_kind = 'entrepreneur'
  order by c.created_at asc nulls last
  limit 1;

  if root_entrepreneur is null then
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
      'Cellule des jeunes entrepreneurs',
      seed_creator,
      'all',
      null,
      null,
      null,
      'entrepreneur',
      null
    );
  else
    update public.conversation
    set
      title = 'Cellule des jeunes entrepreneurs',
      scope_type = 'all',
      region_id = null,
      prefecture_id = null,
      commune_id = null,
      parent_conversation_id = null,
      community_kind = 'entrepreneur'
    where id = root_entrepreneur;
  end if;

  select c.id
  into root_org_leader
  from public.conversation c
  where c.conversation_type = 'community'
    and c.parent_conversation_id is null
    and c.community_kind = 'org_leader'
  order by c.created_at asc nulls last
  limit 1;

  if root_org_leader is null then
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
      'Cellule des responsables d''associations et mouvements de jeunes',
      seed_creator,
      'all',
      null,
      null,
      null,
      'org_leader',
      null
    );
  else
    update public.conversation
    set
      title = 'Cellule des responsables d''associations et mouvements de jeunes',
      scope_type = 'all',
      region_id = null,
      prefecture_id = null,
      commune_id = null,
      parent_conversation_id = null,
      community_kind = 'org_leader'
    where id = root_org_leader;
  end if;
end
$$;

commit;

select
  c.id,
  c.title,
  c.community_kind,
  c.parent_conversation_id,
  c.created_at
from public.conversation c
where c.conversation_type = 'community'
  and c.parent_conversation_id is null
  and c.community_kind in ('czi', 'engaged', 'entrepreneur', 'org_leader')
order by
  case c.community_kind
    when 'czi' then 1
    when 'engaged' then 2
    when 'entrepreneur' then 3
    when 'org_leader' then 4
    else 99
  end,
  c.created_at asc;

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
  and proname in (
    'member_in_community_kind',
    'can_access_conversation',
    'can_post_conversation',
    'enforce_conversation_structure'
  )
order by proname;
