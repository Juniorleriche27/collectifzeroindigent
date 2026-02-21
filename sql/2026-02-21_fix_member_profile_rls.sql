begin;

alter table public.profile enable row level security;
alter table public.member enable row level security;

do $$
declare
  p record;
begin
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
end $$;

create policy profile_select_self
on public.profile
for select
using (user_id = auth.uid());

create policy profile_insert_self
on public.profile
for insert
with check (user_id = auth.uid());

create policy profile_update_self
on public.profile
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

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

commit;
