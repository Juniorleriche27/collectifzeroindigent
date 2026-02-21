begin;

alter table public.member
  add column if not exists organisation_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'member_organisation_id_fkey'
      and conrelid = 'public.member'::regclass
  ) then
    alter table public.member
      add constraint member_organisation_id_fkey
      foreign key (organisation_id)
      references public.organisation(id)
      on update cascade
      on delete set null;
  end if;
end
$$;

create index if not exists idx_member_organisation_id
  on public.member (organisation_id);

update public.member m
set organisation_id = o.id
from public.organisation o
where m.organisation_id is null
  and m.join_mode in ('association', 'enterprise')
  and m.org_name is not null
  and lower(trim(m.org_name)) = lower(trim(o.name))
  and o.type = m.join_mode;

commit;
