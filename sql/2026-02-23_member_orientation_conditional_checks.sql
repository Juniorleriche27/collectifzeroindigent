begin;

alter table public.member
  add column if not exists gender text,
  add column if not exists birth_date date,
  add column if not exists age_range text,
  add column if not exists education_level text,
  add column if not exists occupation_status text,
  add column if not exists profession_title text,
  add column if not exists locality text,
  add column if not exists mobility boolean,
  add column if not exists mobility_zones text,
  add column if not exists engagement_domains text[],
  add column if not exists engagement_frequency text,
  add column if not exists engagement_recent_action text,
  add column if not exists business_stage text,
  add column if not exists business_sector text,
  add column if not exists business_needs text[],
  add column if not exists org_role text,
  add column if not exists org_name_declared text,
  add column if not exists skills jsonb,
  add column if not exists interests text[],
  add column if not exists odd_priorities int[],
  add column if not exists goal_3_6_months text,
  add column if not exists support_types text[],
  add column if not exists availability text,
  add column if not exists contact_preference text,
  add column if not exists consent_terms boolean default false,
  add column if not exists consent_analytics boolean default false,
  add column if not exists consent_ai_training_agg boolean default false,
  add column if not exists partner_request boolean default false,
  add column if not exists org_type text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'member_cellule_secondary_check'
      and conrelid = 'public.member'::regclass
  ) then
    alter table public.member
      add constraint member_cellule_secondary_check
      check (
        cellule_secondary is null
        or cellule_secondary in ('engaged', 'entrepreneur', 'org_leader')
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'member_cellule_secondary_distinct_check'
      and conrelid = 'public.member'::regclass
  ) then
    alter table public.member
      add constraint member_cellule_secondary_distinct_check
      check (
        cellule_secondary is null
        or cellule_primary is null
        or cellule_secondary <> cellule_primary
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'member_contact_preference_check'
      and conrelid = 'public.member'::regclass
  ) then
    alter table public.member
      add constraint member_contact_preference_check
      check (
        contact_preference is null
        or contact_preference in ('whatsapp', 'email', 'call')
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'member_org_type_check'
      and conrelid = 'public.member'::regclass
  ) then
    alter table public.member
      add constraint member_org_type_check
      check (
        org_type is null
        or org_type in ('association', 'enterprise')
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'member_odd_priorities_check'
      and conrelid = 'public.member'::regclass
  ) then
    alter table public.member
      add constraint member_odd_priorities_check
      check (
        odd_priorities is null
        or (
          cardinality(odd_priorities) between 1 and 3
          and odd_priorities <@ array[1, 2, 3, 4, 5, 6, 8, 13, 16]::int[]
        )
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'member_partner_request_requires_org_check'
      and conrelid = 'public.member'::regclass
  ) then
    alter table public.member
      add constraint member_partner_request_requires_org_check
      check (
        coalesce(partner_request, false) = false
        or (
          org_type in ('association', 'enterprise')
          and nullif(trim(coalesce(org_name, '')), '') is not null
        )
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'member_active_profile_requirements_check'
      and conrelid = 'public.member'::regclass
  ) then
    alter table public.member
      add constraint member_active_profile_requirements_check
      check (
        status::text <> 'active'
        or (
          nullif(trim(coalesce(education_level, '')), '') is not null
          and nullif(trim(coalesce(occupation_status, '')), '') is not null
          and (
            birth_date is not null
            or nullif(trim(coalesce(age_range, '')), '') is not null
          )
          and nullif(trim(coalesce(contact_preference, '')), '') is not null
          and contact_preference in ('whatsapp', 'email', 'call')
          and coalesce(consent_terms, false) = true
          and skills is not null
          and jsonb_typeof(skills) = 'array'
          and jsonb_array_length(skills) > 0
          and interests is not null
          and cardinality(interests) > 0
          and odd_priorities is not null
          and cardinality(odd_priorities) between 1 and 3
          and odd_priorities <@ array[1, 2, 3, 4, 5, 6, 8, 13, 16]::int[]
          and nullif(trim(coalesce(goal_3_6_months, '')), '') is not null
          and support_types is not null
          and cardinality(support_types) > 0
          and case
            when cellule_primary = 'engaged' then
              engagement_domains is not null
              and cardinality(engagement_domains) > 0
              and nullif(trim(coalesce(engagement_frequency, '')), '') is not null
              and nullif(trim(coalesce(engagement_recent_action, '')), '') is not null
            when cellule_primary = 'entrepreneur' then
              nullif(trim(coalesce(business_stage, '')), '') is not null
              and nullif(trim(coalesce(business_sector, '')), '') is not null
              and business_needs is not null
              and cardinality(business_needs) > 0
            when cellule_primary = 'org_leader' then
              nullif(trim(coalesce(org_role, '')), '') is not null
              and nullif(trim(coalesce(org_name_declared, '')), '') is not null
            else false
          end
        )
      );
  end if;
end
$$;

commit;

select
  c.column_name,
  c.data_type,
  c.is_nullable,
  c.column_default
from information_schema.columns c
where c.table_schema = 'public'
  and c.table_name = 'member'
  and c.column_name in (
    'cellule_primary',
    'cellule_secondary',
    'education_level',
    'occupation_status',
    'contact_preference',
    'consent_terms',
    'odd_priorities',
    'goal_3_6_months',
    'support_types',
    'status'
  )
order by c.column_name;

select
  conname,
  contype
from pg_constraint
where conrelid = 'public.member'::regclass
  and conname in (
    'member_cellule_secondary_check',
    'member_cellule_secondary_distinct_check',
    'member_contact_preference_check',
    'member_org_type_check',
    'member_odd_priorities_check',
    'member_partner_request_requires_org_check',
    'member_active_profile_requirements_check'
  )
order by conname;
