-- Audit minimal: trace des actions "contacter membre" (email / telephone).

begin;

create table if not exists public.member_contact_action (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  actor_user_id uuid not null,
  actor_member_id uuid null references public.member (id) on delete set null,
  target_member_id uuid not null references public.member (id) on delete cascade,
  channel text not null check (channel in ('email', 'phone')),
  source text not null default 'unknown',
  target_email text null,
  target_phone text null,
  metadata jsonb null default '{}'::jsonb,
  constraint member_contact_action_target_contact_check check (
    (channel = 'email' and target_email is not null and length(trim(target_email)) > 0)
    or (channel = 'phone' and target_phone is not null and length(trim(target_phone)) > 0)
  )
);

create index if not exists idx_member_contact_action_created_at
  on public.member_contact_action (created_at desc);

create index if not exists idx_member_contact_action_actor_user
  on public.member_contact_action (actor_user_id);

create index if not exists idx_member_contact_action_target_member
  on public.member_contact_action (target_member_id);

alter table public.member_contact_action enable row level security;

grant select, insert on public.member_contact_action to authenticated;

drop policy if exists member_contact_action_insert on public.member_contact_action;
create policy member_contact_action_insert
  on public.member_contact_action
  for insert
  to authenticated
  with check (actor_user_id = auth.uid());

drop policy if exists member_contact_action_select on public.member_contact_action;
create policy member_contact_action_select
  on public.member_contact_action
  for select
  to authenticated
  using (
    actor_user_id = auth.uid()
    or coalesce(public.current_profile_role(), 'member') in ('admin', 'ca', 'cn', 'pf')
  );

commit;

-- Verification rapide
select
  tablename,
  policyname,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'member_contact_action'
order by policyname;
