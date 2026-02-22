-- Ensure the profile_role enum contains governance values used by the app.
-- Run this before setting profile.role to pf/cn/ca/admin.

alter type public.profile_role add value if not exists 'member';
alter type public.profile_role add value if not exists 'pf';
alter type public.profile_role add value if not exists 'cn';
alter type public.profile_role add value if not exists 'ca';
alter type public.profile_role add value if not exists 'admin';

-- Verification
select e.enumlabel
from pg_enum e
join pg_type t on t.oid = e.enumtypid
join pg_namespace n on n.oid = t.typnamespace
where n.nspname = 'public'
  and t.typname = 'profile_role'
order by e.enumsortorder;
