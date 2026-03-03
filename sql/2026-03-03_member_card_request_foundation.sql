begin;

create extension if not exists pgcrypto;

alter table public.member
  add column if not exists photo_url text,
  add column if not exists photo_status text not null default 'missing',
  add column if not exists photo_rejection_reason text;

alter table public.member
  drop constraint if exists member_photo_status_check;

alter table public.member
  add constraint member_photo_status_check
  check (photo_status in ('missing', 'uploaded', 'approved', 'rejected'));

create table if not exists public.member_card_request (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.member(id) on delete cascade,
  requested boolean not null default false,
  price_cfa int not null default 2900,
  payment_status text not null default 'unpaid',
  payment_provider text null,
  payment_ref text null,
  card_status text not null default 'draft',
  card_number text unique null,
  card_pdf_url text null,
  card_png_url text null,
  print_by uuid null references auth.users(id) on delete set null,
  printed_at timestamptz null,
  delivered_at timestamptz null,
  delivery_mode text null,
  delivery_contact text null,
  delivery_address text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uniq_member_card_request_member
  on public.member_card_request (member_id);

alter table public.member_card_request
  drop constraint if exists member_card_request_price_positive_check;
alter table public.member_card_request
  add constraint member_card_request_price_positive_check
  check (price_cfa > 0);

alter table public.member_card_request
  drop constraint if exists member_card_request_payment_status_check;
alter table public.member_card_request
  add constraint member_card_request_payment_status_check
  check (payment_status in ('unpaid', 'pending', 'paid', 'failed', 'refunded'));

alter table public.member_card_request
  drop constraint if exists member_card_request_card_status_check;
alter table public.member_card_request
  add constraint member_card_request_card_status_check
  check (card_status in ('draft', 'ready', 'printed', 'delivered', 'cancelled'));

alter table public.member_card_request
  drop constraint if exists member_card_request_delivery_mode_check;
alter table public.member_card_request
  add constraint member_card_request_delivery_mode_check
  check (delivery_mode is null or delivery_mode in ('pickup', 'delivery'));

create index if not exists idx_member_card_request_status
  on public.member_card_request (card_status, payment_status, created_at desc);

create or replace function public.set_member_card_request_updated_at()
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

drop trigger if exists trg_set_member_card_request_updated_at on public.member_card_request;
create trigger trg_set_member_card_request_updated_at
before update on public.member_card_request
for each row
execute function public.set_member_card_request_updated_at();

create or replace function public.member_card_request_auto_ready()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  member_photo_status text;
begin
  select coalesce(m.photo_status, 'missing')
  into member_photo_status
  from public.member m
  where m.id = new.member_id;

  if new.requested = true
     and new.payment_status = 'paid'
     and member_photo_status in ('uploaded', 'approved') then
    if coalesce(new.card_number, '') = '' then
      new.card_number := 'CZI-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(gen_random_uuid()::text, 1, 8));
    end if;

    if new.card_status in ('draft', 'cancelled') then
      new.card_status := 'ready';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_member_card_request_auto_ready on public.member_card_request;
create trigger trg_member_card_request_auto_ready
before insert or update on public.member_card_request
for each row
execute function public.member_card_request_auto_ready();

alter table public.member_card_request enable row level security;
grant select, insert, update on public.member_card_request to authenticated;
revoke delete on public.member_card_request from authenticated;

drop policy if exists member_card_request_select_own_or_manager on public.member_card_request;
create policy member_card_request_select_own_or_manager
on public.member_card_request
for select
to authenticated
using (
  exists (
    select 1
    from public.member m
    where m.id = member_card_request.member_id
      and m.user_id = auth.uid()
  )
  or coalesce(public.current_profile_role(), 'member') in ('admin', 'ca', 'cn', 'pf')
);

drop policy if exists member_card_request_insert_own on public.member_card_request;
create policy member_card_request_insert_own
on public.member_card_request
for insert
to authenticated
with check (
  member_id = public.current_member_id()
);

drop policy if exists member_card_request_update_own_limited on public.member_card_request;
create policy member_card_request_update_own_limited
on public.member_card_request
for update
to authenticated
using (
  member_id = public.current_member_id()
)
with check (
  member_id = public.current_member_id()
  and payment_status in ('unpaid', 'pending', 'failed')
  and card_status in ('draft', 'cancelled')
  and print_by is null
  and printed_at is null
  and delivered_at is null
);

drop policy if exists member_card_request_update_manager on public.member_card_request;
create policy member_card_request_update_manager
on public.member_card_request
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
  and tablename in ('member_card_request')
order by tablename, policyname;
