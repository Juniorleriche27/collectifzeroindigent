begin;

alter table public.member
  add column if not exists skills_tags text[] null,
  add column if not exists interests_tags text[] null,
  add column if not exists income_range text null,
  add column if not exists income_stability text null,
  add column if not exists dependents_count text null,
  add column if not exists housing_status text null,
  add column if not exists food_security text null,
  add column if not exists health_access text null,
  add column if not exists savings_level text null,
  add column if not exists debt_level text null,
  add column if not exists employment_duration_if_searching text null,
  add column if not exists urgent_needs text[] null,
  add column if not exists recent_shock text null,
  add column if not exists disability_or_limitation boolean null,
  add column if not exists indigence_score integer null,
  add column if not exists indigence_level text null,
  add column if not exists indigence_factors text[] null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'member_indigence_score_check'
  ) then
    alter table public.member
      add constraint member_indigence_score_check
      check (
        indigence_score is null
        or (indigence_score >= 0 and indigence_score <= 100)
      );
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'member_indigence_level_check'
  ) then
    alter table public.member
      add constraint member_indigence_level_check
      check (
        indigence_level is null
        or indigence_level in ('faible', 'moderee', 'forte', 'critique')
      );
  end if;
end;
$$;

commit;
