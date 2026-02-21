begin;

alter table public.profile enable row level security;
alter table public.member enable row level security;

do $$
declare
  p record;
  profile_auth_column text;
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'profile' and column_name = 'user_id'
  ) then
    profile_auth_column := 'user_id';
  elsif exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'profile' and column_name = 'id'
  ) then
    profile_auth_column := 'id';
  else
    raise exception 'public.profile must contain either user_id or id column for RLS.';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'member' and column_name = 'user_id'
  ) then
    raise exception 'public.member.user_id is required for RLS policies.';
  end if;

  for p in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'profile'
  loop
    execute format('drop policy if exists %I on public.profile', p.policyname);
  end loop;

  for p in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'member'
  loop
    execute format('drop policy if exists %I on public.member', p.policyname);
  end loop;
  execute format(
    'create policy profile_select_self on public.profile for select using (%I = auth.uid())',
    profile_auth_column
  );
  execute format(
    'create policy profile_insert_self on public.profile for insert with check (%I = auth.uid())',
    profile_auth_column
  );
  execute format(
    'create policy profile_update_self on public.profile for update using (%I = auth.uid()) with check (%I = auth.uid())',
    profile_auth_column,
    profile_auth_column
  );

  create policy member_select_self
  on public.member
  for select
  using (user_id = auth.uid());

  create policy member_insert_self
  on public.member
  for insert
  with check (user_id = auth.uid());

  create policy member_update_self
  on public.member
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
end $$;

commit;
