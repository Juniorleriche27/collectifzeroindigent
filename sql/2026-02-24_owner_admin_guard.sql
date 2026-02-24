begin;

do $$
declare
  owner_email constant text := 'ylamadokou@gmail.com';
  owner_user_uuid uuid;
begin
  select m.user_id
  into owner_user_uuid
  from public.member m
  where lower(trim(coalesce(m.email, ''))) = owner_email
  order by m.created_at desc nulls last
  limit 1;

  if owner_user_uuid is null then
    raise notice 'Aucun membre trouve pour %.', owner_email;
    return;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profile'
      and column_name = 'user_id'
  ) then
    update public.profile
    set role = 'admin'
    where user_id = owner_user_uuid;
  elsif exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profile'
      and column_name = 'id'
  ) then
    update public.profile
    set role = 'admin'
    where id = owner_user_uuid;
  else
    raise exception 'public.profile must contain user_id or id.';
  end if;
end
$$;

commit;

with owner as (
  select m.user_id, m.email
  from public.member m
  where lower(trim(coalesce(m.email, ''))) = 'ylamadokou@gmail.com'
  order by m.created_at desc nulls last
  limit 1
)
select
  owner.user_id,
  owner.email,
  (
    select p.role::text
    from public.profile p
    where (to_jsonb(p) ->> 'user_id') = owner.user_id::text
       or (to_jsonb(p) ->> 'id') = owner.user_id::text
    limit 1
  ) as profile_role
from owner;
