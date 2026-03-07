begin;

create or replace function public.current_member_id()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  result uuid;
begin
  begin
    execute 'select m.id from public.member m where m.user_id = auth.uid() order by m.created_at desc nulls last limit 1'
      into result;
  exception
    when undefined_column then
      return null;
  end;

  return result;
end;
$$;

grant execute on function public.current_member_id() to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'member-photos',
  'member-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'member_photos_select_own_or_manager'
  ) then
    create policy member_photos_select_own_or_manager
    on storage.objects
    for select
    to authenticated
    using (
      bucket_id = 'member-photos'
      and (
        coalesce(public.current_profile_role(), 'member') in ('admin', 'ca', 'cn', 'pf')
        or (
          (storage.foldername(name))[1] = 'member'
          and (storage.foldername(name))[2] = public.current_member_id()::text
        )
      )
    );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'member_photos_insert_own_or_manager'
  ) then
    create policy member_photos_insert_own_or_manager
    on storage.objects
    for insert
    to authenticated
    with check (
      bucket_id = 'member-photos'
      and (
        coalesce(public.current_profile_role(), 'member') in ('admin', 'ca', 'cn', 'pf')
        or (
          (storage.foldername(name))[1] = 'member'
          and (storage.foldername(name))[2] = public.current_member_id()::text
        )
      )
    );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'member_photos_update_own_or_manager'
  ) then
    create policy member_photos_update_own_or_manager
    on storage.objects
    for update
    to authenticated
    using (
      bucket_id = 'member-photos'
      and (
        coalesce(public.current_profile_role(), 'member') in ('admin', 'ca', 'cn', 'pf')
        or (
          (storage.foldername(name))[1] = 'member'
          and (storage.foldername(name))[2] = public.current_member_id()::text
        )
      )
    )
    with check (
      bucket_id = 'member-photos'
      and (
        coalesce(public.current_profile_role(), 'member') in ('admin', 'ca', 'cn', 'pf')
        or (
          (storage.foldername(name))[1] = 'member'
          and (storage.foldername(name))[2] = public.current_member_id()::text
        )
      )
    );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'member_photos_delete_own_or_manager'
  ) then
    create policy member_photos_delete_own_or_manager
    on storage.objects
    for delete
    to authenticated
    using (
      bucket_id = 'member-photos'
      and (
        coalesce(public.current_profile_role(), 'member') in ('admin', 'ca', 'cn', 'pf')
        or (
          (storage.foldername(name))[1] = 'member'
          and (storage.foldername(name))[2] = public.current_member_id()::text
        )
      )
    );
  end if;
end $$;

commit;
