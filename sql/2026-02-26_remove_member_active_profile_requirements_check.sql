begin;

alter table public.member
  drop constraint if exists member_active_profile_requirements_check;

commit;

select
  conname
from pg_constraint
where conrelid = 'public.member'::regclass
  and conname = 'member_active_profile_requirements_check';
