begin;

create extension if not exists pgcrypto;

alter table public.message
  add column if not exists parent_message_id uuid,
  add column if not exists edited_at timestamptz,
  add column if not exists mention_member_ids uuid[] not null default '{}';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'message_parent_message_fk'
  ) then
    alter table public.message
      add constraint message_parent_message_fk
      foreign key (parent_message_id)
      references public.message(id)
      on delete set null;
  end if;
end
$$;

create index if not exists idx_message_parent_message_id
  on public.message (parent_message_id);

create index if not exists idx_message_mention_member_ids
  on public.message using gin (mention_member_ids);

create or replace function public.enforce_message_thread_consistency()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  parent_row record;
begin
  if new.parent_message_id is null then
    return new;
  end if;

  if new.id is not null and new.id = new.parent_message_id then
    raise exception 'message cannot reply to itself';
  end if;

  select m.id, m.conversation_id
  into parent_row
  from public.message m
  where m.id = new.parent_message_id;

  if not found then
    raise exception 'parent message not found';
  end if;

  if parent_row.conversation_id <> new.conversation_id then
    raise exception 'parent message must belong to same conversation';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_message_thread_consistency on public.message;
create trigger trg_enforce_message_thread_consistency
before insert or update on public.message
for each row
execute function public.enforce_message_thread_consistency();

create table if not exists public.message_like (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.message(id) on delete cascade,
  member_id uuid not null references public.member(id) on delete cascade,
  reaction text not null default 'like',
  created_at timestamptz not null default now(),
  constraint message_like_reaction_check check (reaction = 'like'),
  constraint message_like_unique unique (message_id, member_id, reaction)
);

create index if not exists idx_message_like_message
  on public.message_like (message_id, created_at desc);

create index if not exists idx_message_like_member
  on public.message_like (member_id, created_at desc);

alter table public.message_like enable row level security;

drop policy if exists message_like_select on public.message_like;
create policy message_like_select
on public.message_like
for select
using (
  exists (
    select 1
    from public.message m
    where m.id = message_like.message_id
      and public.can_access_conversation(m.conversation_id)
  )
);

drop policy if exists message_like_insert on public.message_like;
create policy message_like_insert
on public.message_like
for insert
with check (
  member_id = public.current_member_id()
  and reaction = 'like'
  and exists (
    select 1
    from public.message m
    where m.id = message_like.message_id
      and public.can_access_conversation(m.conversation_id)
  )
);

drop policy if exists message_like_delete on public.message_like;
create policy message_like_delete
on public.message_like
for delete
using (
  member_id = public.current_member_id()
  and exists (
    select 1
    from public.message m
    where m.id = message_like.message_id
      and public.can_access_conversation(m.conversation_id)
  )
);

commit;

select
  c.column_name,
  c.data_type,
  c.is_nullable
from information_schema.columns c
where c.table_schema = 'public'
  and c.table_name = 'message'
  and c.column_name in ('parent_message_id', 'edited_at', 'mention_member_ids')
order by c.column_name;

select
  tablename,
  policyname,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'message_like'
order by policyname;

select
  proname
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and proname in ('enforce_message_thread_consistency')
order by proname;
