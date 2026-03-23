do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    join pg_enum e on e.enumtypid = t.oid
    where n.nspname = 'public'
      and t.typname = 'conversation_community_kind'
      and e.enumlabel = 'region'
  ) then
    alter type public.conversation_community_kind add value 'region';
  end if;
end
$$;
