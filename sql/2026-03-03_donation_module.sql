begin;

create extension if not exists pgcrypto;

create table if not exists public.donation (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  member_id uuid null references public.member(id) on delete set null,
  amount_cfa int not null check (amount_cfa > 0),
  currency text not null default 'XOF',
  message text null,
  status text not null default 'pledged' check (status in ('pledged', 'pending', 'paid', 'failed', 'cancelled', 'refunded')),
  payment_provider text null,
  payment_ref text null,
  paid_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_donation_user_created
  on public.donation (user_id, created_at desc);

create index if not exists idx_donation_member_created
  on public.donation (member_id, created_at desc);

create index if not exists idx_donation_status_created
  on public.donation (status, created_at desc);

create or replace function public.set_donation_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_set_donation_updated_at on public.donation;
create trigger trg_set_donation_updated_at
before update on public.donation
for each row
execute function public.set_donation_updated_at();

alter table public.donation enable row level security;

grant select, insert, update on public.donation to authenticated;
revoke delete on public.donation from authenticated;

drop policy if exists donation_select_own_or_manager on public.donation;
create policy donation_select_own_or_manager
on public.donation
for select
to authenticated
using (
  user_id = auth.uid()
  or coalesce(public.current_profile_role(), 'member') in ('admin', 'ca', 'cn', 'pf')
);

drop policy if exists donation_insert_own on public.donation;
create policy donation_insert_own
on public.donation
for insert
to authenticated
with check (
  user_id = auth.uid()
  and status in ('pledged', 'pending')
);

drop policy if exists donation_update_own_limited on public.donation;
create policy donation_update_own_limited
on public.donation
for update
to authenticated
using (
  user_id = auth.uid()
)
with check (
  user_id = auth.uid()
  and status in ('pledged', 'pending', 'cancelled')
);

drop policy if exists donation_update_manager on public.donation;
create policy donation_update_manager
on public.donation
for update
to authenticated
using (
  coalesce(public.current_profile_role(), 'member') in ('admin', 'ca', 'cn', 'pf')
)
with check (
  coalesce(public.current_profile_role(), 'member') in ('admin', 'ca', 'cn', 'pf')
);

commit;

select
  tablename,
  policyname,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'donation'
order by policyname;

