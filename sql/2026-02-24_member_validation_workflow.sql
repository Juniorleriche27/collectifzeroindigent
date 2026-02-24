begin;

do $$
declare
  status_udt_name text;
  status_udt_schema text;
begin
  select c.udt_name, c.udt_schema
  into status_udt_name, status_udt_schema
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'member'
    and c.column_name = 'status';

  if status_udt_name is null then
    return;
  end if;

  if exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = status_udt_schema
      and t.typname = status_udt_name
      and t.typtype = 'e'
  ) then
    execute format(
      'alter type %I.%I add value if not exists ''pending''',
      status_udt_schema,
      status_udt_name
    );
    execute format(
      'alter type %I.%I add value if not exists ''active''',
      status_udt_schema,
      status_udt_name
    );
    execute format(
      'alter type %I.%I add value if not exists ''rejected''',
      status_udt_schema,
      status_udt_name
    );
    execute format(
      'alter type %I.%I add value if not exists ''suspended''',
      status_udt_schema,
      status_udt_name
    );
  end if;
end
$$;

alter table public.member
  add column if not exists validated_by uuid,
  add column if not exists validated_at timestamptz,
  add column if not exists validation_reason text;

create index if not exists idx_member_pending_validation
  on public.member (status, region_id, created_at desc);

create index if not exists idx_member_validation_audit
  on public.member (validated_at desc);

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
  c.data_type,
  c.is_nullable
from information_schema.columns c
where c.table_schema = 'public'
  and c.table_name = 'member'
  and c.column_name in ('status', 'validated_by', 'validated_at', 'validation_reason')
order by c.column_name;

select
  count(*) filter (where status::text = 'pending') as pending_count,
  count(*) filter (where status::text = 'active') as active_count,
  count(*) filter (where status::text = 'rejected') as rejected_count,
  count(*) filter (where status::text = 'suspended') as suspended_count
from public.member;
