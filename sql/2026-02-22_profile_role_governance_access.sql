begin;

alter table public.profile enable row level security;

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
    execute 'select p.role::text from public.profile p where p.user_id = auth.uid() limit 1'
      into role_value;
  elsif has_profile_id then
    execute 'select p.role::text from public.profile p where p.id = auth.uid() limit 1'
      into role_value;
  end if;

  role_value := lower(trim(coalesce(role_value, 'member')));
  if role_value = '' then
    return 'member';
  end if;

  return role_value;
end;
$$;

grant execute on function public.current_profile_role() to authenticated;

do $$
declare
  p record;
  profile_auth_column text;
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profile'
      and column_name = 'user_id'
  ) then
    profile_auth_column := 'user_id';
  elsif exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profile'
      and column_name = 'id'
  ) then
    profile_auth_column := 'id';
  else
    raise exception 'public.profile must contain either user_id or id column for RLS.';
  end if;

  for p in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profile'
  loop
    execute format('drop policy if exists %I on public.profile', p.policyname);
  end loop;

  execute format(
    'create policy profile_select_by_role on public.profile for select using (%I = auth.uid() or public.current_profile_role() in (''admin'',''ca''))',
    profile_auth_column
  );

  execute format(
    'create policy profile_insert_self on public.profile for insert with check (%I = auth.uid())',
    profile_auth_column
  );

  execute format(
    'create policy profile_update_by_role on public.profile for update using (%I = auth.uid() or public.current_profile_role() in (''admin'',''ca'')) with check ((%I = auth.uid()) or (public.current_profile_role() = ''admin'' and lower(coalesce(role::text,''member'')) in (''member'',''pf'',''cn'',''ca'',''admin'')) or (public.current_profile_role() = ''ca'' and lower(coalesce(role::text,''member'')) in (''member'',''pf'',''cn'')))',
    profile_auth_column,
    profile_auth_column
  );
end $$;

commit;
