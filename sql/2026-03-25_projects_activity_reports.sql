begin;

-- ═══════════════════════════════════════════════════
-- TABLE: project
-- ═══════════════════════════════════════════════════

create table if not exists public.project (
  id                uuid        primary key default gen_random_uuid(),
  title             text        not null,
  short_description text        null,
  description       text        null,
  status            text        not null default 'upcoming',
  cover_image_url   text        null,
  start_date        date        null,
  end_date          date        null,
  location          text        null,
  is_published      boolean     not null default false,
  created_by        uuid        null references auth.users(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.project
  drop constraint if exists project_status_check;
alter table public.project
  add constraint project_status_check
  check (status in ('upcoming', 'active', 'completed', 'cancelled'));

create index if not exists idx_project_status_published
  on public.project (status, is_published, created_at desc);

create or replace function public.set_project_updated_at()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_set_project_updated_at on public.project;
create trigger trg_set_project_updated_at
  before update on public.project
  for each row execute function public.set_project_updated_at();

alter table public.project enable row level security;

grant select on public.project to anon;
grant select, insert, update on public.project to authenticated;

drop policy if exists project_select on public.project;
create policy project_select
  on public.project for select
  using (
    is_published = true
    or coalesce(public.current_profile_role(), 'member') in ('admin', 'ca', 'cn', 'pf')
  );

drop policy if exists project_insert_manager on public.project;
create policy project_insert_manager
  on public.project for insert
  to authenticated
  with check (
    coalesce(public.current_profile_role(), 'member') in ('admin', 'ca', 'cn', 'pf')
  );

drop policy if exists project_update_manager on public.project;
create policy project_update_manager
  on public.project for update
  to authenticated
  using (
    coalesce(public.current_profile_role(), 'member') in ('admin', 'ca', 'cn', 'pf')
  )
  with check (
    coalesce(public.current_profile_role(), 'member') in ('admin', 'ca', 'cn', 'pf')
  );


-- ═══════════════════════════════════════════════════
-- TABLE: activity_report
-- ═══════════════════════════════════════════════════

create table if not exists public.activity_report (
  id               uuid        primary key default gen_random_uuid(),
  title            text        not null,
  description      text        null,
  project_id       uuid        null references public.project(id) on delete set null,
  file_url         text        null,
  file_name        text        null,
  file_size_bytes  integer     null,
  is_published     boolean     not null default false,
  is_public        boolean     not null default false,
  published_at     timestamptz null,
  created_by       uuid        null references auth.users(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_activity_report_project
  on public.activity_report (project_id);
create index if not exists idx_activity_report_published
  on public.activity_report (is_published, created_at desc);

create or replace function public.set_activity_report_updated_at()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_set_activity_report_updated_at on public.activity_report;
create trigger trg_set_activity_report_updated_at
  before update on public.activity_report
  for each row execute function public.set_activity_report_updated_at();

alter table public.activity_report enable row level security;

grant select on public.activity_report to anon;
grant select, insert, update on public.activity_report to authenticated;

drop policy if exists activity_report_select on public.activity_report;
create policy activity_report_select
  on public.activity_report for select
  using (
    is_published = true
    or coalesce(public.current_profile_role(), 'member') in ('admin', 'ca', 'cn', 'pf')
  );

drop policy if exists activity_report_insert_manager on public.activity_report;
create policy activity_report_insert_manager
  on public.activity_report for insert
  to authenticated
  with check (
    coalesce(public.current_profile_role(), 'member') in ('admin', 'ca', 'cn', 'pf')
  );

drop policy if exists activity_report_update_manager on public.activity_report;
create policy activity_report_update_manager
  on public.activity_report for update
  to authenticated
  using (
    coalesce(public.current_profile_role(), 'member') in ('admin', 'ca', 'cn', 'pf')
  )
  with check (
    coalesce(public.current_profile_role(), 'member') in ('admin', 'ca', 'cn', 'pf')
  );

commit;

-- ═══════════════════════════════════════════════════
-- STORAGE BUCKET: activity-reports
-- ═══════════════════════════════════════════════════

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'activity-reports',
  'activity-reports',
  false,
  20971520,  -- 20 MB
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do nothing;

-- Allow authenticated users to read report files
drop policy if exists activity_reports_storage_read on storage.objects;
create policy activity_reports_storage_read
  on storage.objects for select
  to authenticated
  using (bucket_id = 'activity-reports');

-- Only managers can upload report files
drop policy if exists activity_reports_storage_insert on storage.objects;
create policy activity_reports_storage_insert
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'activity-reports'
    and coalesce(public.current_profile_role(), 'member') in ('admin', 'ca', 'cn', 'pf')
  );

-- Only managers can delete report files
drop policy if exists activity_reports_storage_delete on storage.objects;
create policy activity_reports_storage_delete
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'activity-reports'
    and coalesce(public.current_profile_role(), 'member') in ('admin', 'ca', 'cn', 'pf')
  );

-- Verify
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('project', 'activity_report')
order by tablename, policyname;
