begin;

create extension if not exists pgcrypto;

create table if not exists public.organisation (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('association', 'enterprise')),
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists organisation_name_type_uidx
  on public.organisation (lower(name), type);

create or replace function public.set_organisation_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_organisation_updated_at on public.organisation;
create trigger trg_organisation_updated_at
before update on public.organisation
for each row
execute function public.set_organisation_updated_at();

alter table public.organisation enable row level security;

drop policy if exists organisation_select_authenticated on public.organisation;
create policy organisation_select_authenticated
on public.organisation
for select
using (auth.uid() is not null);

drop policy if exists organisation_insert_authenticated on public.organisation;
create policy organisation_insert_authenticated
on public.organisation
for insert
with check (auth.uid() is not null and created_by = auth.uid());

drop policy if exists organisation_update_owner on public.organisation;
create policy organisation_update_owner
on public.organisation
for update
using (created_by = auth.uid())
with check (created_by = auth.uid());

drop policy if exists organisation_delete_owner on public.organisation;
create policy organisation_delete_owner
on public.organisation
for delete
using (created_by = auth.uid());

commit;
