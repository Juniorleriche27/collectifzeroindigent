begin;

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
  count(*) filter (where status = 'pending') as pending_count,
  count(*) filter (where status = 'active') as active_count,
  count(*) filter (where status = 'rejected') as rejected_count,
  count(*) filter (where status = 'suspended') as suspended_count
from public.member;
