begin;

create or replace function public.can_read_announcement_scope(
  announcement_uuid uuid,
  scope_kind public.scope_level,
  scope_region_id uuid,
  scope_prefecture_id uuid,
  scope_commune_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_communication_manager()
    or (
      exists (
        select 1
        from public.announcement a
        where a.id = announcement_uuid
          and a.is_published = true
      )
      and public.scope_matches_member(
        scope_kind,
        scope_region_id,
        scope_prefecture_id,
        scope_commune_id
      )
    );
$$;

grant execute on function public.can_read_announcement_scope(uuid, public.scope_level, uuid, uuid, uuid) to authenticated;

do $$
begin
  if to_regclass('public.announcement_scope') is not null then
    execute 'drop policy if exists announcement_scope_select on public.announcement_scope';
    execute '
      create policy announcement_scope_select
      on public.announcement_scope
      for select
      using (
        public.can_read_announcement_scope(
          announcement_scope.announcement_id,
          announcement_scope.scope_type,
          announcement_scope.region_id,
          announcement_scope.prefecture_id,
          announcement_scope.commune_id
        )
      )
    ';
  end if;
end
$$;

commit;
