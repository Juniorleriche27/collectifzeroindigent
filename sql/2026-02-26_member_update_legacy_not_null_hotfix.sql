begin;

-- Hotfix production: anciennes colonnes legacy peuvent casser le trigger moderne.
-- Objectif: rendre ces colonnes optionnelles si elles existent.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'member_update'
      and column_name = 'field_changed'
  ) then
    execute 'alter table public.member_update alter column field_changed drop not null';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'member_update'
      and column_name = 'old_value'
  ) then
    execute 'alter table public.member_update alter column old_value drop not null';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'member_update'
      and column_name = 'new_value'
  ) then
    execute 'alter table public.member_update alter column new_value drop not null';
  end if;
end
$$;

commit;

select
  c.column_name,
  c.is_nullable
from information_schema.columns c
where c.table_schema = 'public'
  and c.table_name = 'member_update'
  and c.column_name in ('field_changed', 'old_value', 'new_value')
order by c.column_name;
