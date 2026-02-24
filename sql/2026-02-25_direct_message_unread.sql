begin;

alter table public.conversation_participant
  add column if not exists last_read_at timestamptz;

update public.conversation_participant
set last_read_at = coalesce(last_read_at, joined_at, now())
where last_read_at is null;

create index if not exists idx_conversation_participant_member_read
  on public.conversation_participant (member_id, conversation_id, last_read_at);

create index if not exists idx_message_conversation_created_sender
  on public.message (conversation_id, created_at desc, sender_member_id)
  where deleted_at is null;

create or replace function public.mark_conversation_read(conversation_uuid uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_member_uuid uuid;
begin
  if auth.uid() is null then
    return false;
  end if;

  current_member_uuid := public.current_member_id();
  if current_member_uuid is null then
    return false;
  end if;

  if not public.can_access_conversation(conversation_uuid) then
    return false;
  end if;

  update public.conversation_participant cp
  set last_read_at = now()
  where cp.conversation_id = conversation_uuid
    and cp.member_id = current_member_uuid;

  return found;
end;
$$;

create or replace function public.unread_direct_counts(conversation_ids uuid[])
returns table (
  conversation_id uuid,
  unread_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    cp.conversation_id,
    count(m.id)::bigint as unread_count
  from public.conversation_participant cp
  join public.conversation c
    on c.id = cp.conversation_id
   and c.conversation_type = 'direct'
  left join public.message m
    on m.conversation_id = cp.conversation_id
   and m.deleted_at is null
   and m.sender_member_id <> cp.member_id
   and m.created_at > coalesce(cp.last_read_at, cp.joined_at, to_timestamp(0))
  where cp.member_id = public.current_member_id()
    and cp.conversation_id = any(conversation_ids)
  group by cp.conversation_id;
$$;

grant execute on function public.mark_conversation_read(uuid) to authenticated;
grant execute on function public.unread_direct_counts(uuid[]) to authenticated;

commit;

select
  c.column_name,
  c.data_type,
  c.is_nullable
from information_schema.columns c
where c.table_schema = 'public'
  and c.table_name = 'conversation_participant'
  and c.column_name in ('last_read_at')
order by c.column_name;

select
  proname
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and proname in ('mark_conversation_read', 'unread_direct_counts')
order by proname;
