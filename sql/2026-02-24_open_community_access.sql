begin;

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
  and proname in ('can_access_conversation', 'can_post_conversation')
order by proname;
