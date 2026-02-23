begin;

create or replace function public.is_communication_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.current_profile_role() in ('admin', 'ca', 'cn', 'pf')
    or exists (
      select 1
      from public.communication_team ct
      where ct.user_id = auth.uid()
        and (ct.can_publish = true or ct.can_send_email = true)
    );
$$;

grant execute on function public.is_communication_manager() to authenticated;

commit;
