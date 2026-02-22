begin;

alter table public.member enable row level security;

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
    execute 'select p.role from public.profile p where p.user_id = auth.uid() limit 1'
      into role_value;
  elsif has_profile_id then
    execute 'select p.role from public.profile p where p.id = auth.uid() limit 1'
      into role_value;
  end if;

  role_value := lower(trim(coalesce(role_value, 'member')));
  if role_value = '' then
    return 'member';
  end if;

  return role_value;
end;
$$;

create or replace function public.current_member_region_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select m.region_id
  from public.member m
  where m.user_id = auth.uid()
  order by m.created_at desc nulls last
  limit 1;
$$;

grant execute on function public.current_profile_role() to authenticated;
grant execute on function public.current_member_region_id() to authenticated;

do $$
declare
  p record;
begin
  for p in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'member'
  loop
    execute format('drop policy if exists %I on public.member', p.policyname);
  end loop;
end;
$$;

create policy member_select_by_role
on public.member
for select
using (
  user_id = auth.uid()
  or public.current_profile_role() in ('member', 'admin', 'ca', 'cn', 'pf')
);

create policy member_insert_by_role
on public.member
for insert
with check (
  user_id = auth.uid()
  or public.current_profile_role() in ('admin', 'ca', 'cn')
  or (
    public.current_profile_role() = 'pf'
    and region_id = public.current_member_region_id()
  )
);

create policy member_update_by_role
on public.member
for update
using (
  user_id = auth.uid()
  or public.current_profile_role() in ('admin', 'ca', 'cn')
  or (
    public.current_profile_role() = 'pf'
    and region_id = public.current_member_region_id()
  )
)
with check (
  user_id = auth.uid()
  or public.current_profile_role() in ('admin', 'ca', 'cn')
  or (
    public.current_profile_role() = 'pf'
    and region_id = public.current_member_region_id()
  )
);

commit;
