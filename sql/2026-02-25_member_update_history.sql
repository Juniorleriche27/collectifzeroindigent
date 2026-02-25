-- Historisation des modifications membre (qui, quoi, quand).

begin;

create table if not exists public.member_update (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  operation text not null check (operation in ('insert', 'update', 'delete')),
  member_id uuid not null,
  actor_user_id uuid null,
  actor_member_id uuid null references public.member (id) on delete set null,
  changed_fields text[] not null default '{}',
  before_data jsonb null,
  after_data jsonb null
);

create index if not exists idx_member_update_created_at
  on public.member_update (created_at desc);

create index if not exists idx_member_update_member_id
  on public.member_update (member_id);

create index if not exists idx_member_update_actor_user_id
  on public.member_update (actor_user_id);

alter table public.member_update enable row level security;

grant select on public.member_update to authenticated;
revoke insert, update, delete on public.member_update from authenticated;

create or replace function public.log_member_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_user_id uuid := auth.uid();
  v_actor_member_id uuid := null;
  v_before jsonb := null;
  v_after jsonb := null;
  v_changed_fields text[] := '{}';
begin
  if v_actor_user_id is not null then
    select m.id
    into v_actor_member_id
    from public.member m
    where m.user_id = v_actor_user_id
    order by m.created_at desc nulls last
    limit 1;
  end if;

  if tg_op = 'INSERT' then
    v_after := to_jsonb(new);
    select coalesce(array_agg(k.key order by k.key), '{}')
    into v_changed_fields
    from jsonb_each(v_after) as k;

    insert into public.member_update (
      operation,
      member_id,
      actor_user_id,
      actor_member_id,
      changed_fields,
      before_data,
      after_data
    )
    values (
      'insert',
      new.id,
      v_actor_user_id,
      v_actor_member_id,
      v_changed_fields,
      null,
      v_after
    );

    return new;
  end if;

  if tg_op = 'UPDATE' then
    v_before := to_jsonb(old);
    v_after := to_jsonb(new);

    with all_keys as (
      select key from jsonb_object_keys(v_before) as key
      union
      select key from jsonb_object_keys(v_after) as key
    )
    select coalesce(array_agg(key order by key), '{}')
    into v_changed_fields
    from all_keys
    where (v_before -> key) is distinct from (v_after -> key);

    if coalesce(array_length(v_changed_fields, 1), 0) = 0 then
      return new;
    end if;

    insert into public.member_update (
      operation,
      member_id,
      actor_user_id,
      actor_member_id,
      changed_fields,
      before_data,
      after_data
    )
    values (
      'update',
      new.id,
      v_actor_user_id,
      v_actor_member_id,
      v_changed_fields,
      v_before,
      v_after
    );

    return new;
  end if;

  -- DELETE
  v_before := to_jsonb(old);
  select coalesce(array_agg(k.key order by k.key), '{}')
  into v_changed_fields
  from jsonb_each(v_before) as k;

  insert into public.member_update (
    operation,
    member_id,
    actor_user_id,
    actor_member_id,
    changed_fields,
    before_data,
    after_data
  )
  values (
    'delete',
    old.id,
    v_actor_user_id,
    v_actor_member_id,
    v_changed_fields,
    v_before,
    null
  );

  return old;
end;
$$;

drop trigger if exists trg_member_update_audit on public.member;
create trigger trg_member_update_audit
after insert or update or delete on public.member
for each row
execute function public.log_member_update();

drop policy if exists member_update_select on public.member_update;
create policy member_update_select
  on public.member_update
  for select
  to authenticated
  using (
    actor_user_id = auth.uid()
    or coalesce(public.current_profile_role(), 'member') in ('admin', 'ca', 'cn', 'pf')
  );

drop policy if exists member_update_insert_internal on public.member_update;
create policy member_update_insert_internal
  on public.member_update
  for insert
  to authenticated
  with check (
    actor_user_id = auth.uid()
    or actor_user_id is null
    or auth.role() = 'service_role'
  );

commit;

-- Verification rapide
select
  tablename,
  policyname,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'member_update'
order by policyname;
