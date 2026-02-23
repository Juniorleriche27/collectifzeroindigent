begin;

alter table public.member
  add column if not exists cellule_primary text;

alter table public.member
  add column if not exists cellule_secondary text;

update public.member
set cellule_primary = case
  when lower(join_mode::text) = 'enterprise' then 'entrepreneur'
  when lower(join_mode::text) = 'association' then 'org_leader'
  else 'engaged'
end
where cellule_primary is null;

alter table public.member
  alter column cellule_primary set default 'engaged';

alter table public.member
  alter column cellule_primary set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'member_cellule_primary_check'
      and conrelid = 'public.member'::regclass
  ) then
    alter table public.member
      add constraint member_cellule_primary_check
      check (cellule_primary in ('engaged', 'entrepreneur', 'org_leader'));
  end if;
end
$$;

update public.member
set status = 'pending'
where status is null;

alter table public.member
  alter column status set default 'pending';

alter table public.member
  alter column status set not null;

commit;

select
  c.column_name,
  c.is_nullable,
  c.column_default
from information_schema.columns c
where c.table_schema = 'public'
  and c.table_name = 'member'
  and c.column_name in ('cellule_primary', 'status')
order by c.column_name;
