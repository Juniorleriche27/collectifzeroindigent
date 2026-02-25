-- Durcissement des privileges table-level pour anon/authenticated.
-- Objectif: supprimer les grants excessifs (TRUNCATE/TRIGGER/REFERENCES et DML global)
-- et ne laisser que les droits minimaux necessaires au produit.

begin;

do $$
declare
  t text;
begin
  foreach t in array array[
    'region',
    'prefecture',
    'commune',
    'organisation',
    'profile',
    'member',
    'communication_team',
    'announcement',
    'announcement_scope',
    'conversation',
    'conversation_participant',
    'message',
    'message_like',
    'email_campaign',
    'email_campaign_recipient',
    'support_ai_chat',
    'member_contact_action',
    'member_update'
  ]
  loop
    if exists (
      select 1
      from information_schema.tables
      where table_schema = 'public'
        and table_name = t
    ) then
      execute format(
        'revoke all privileges on table public.%I from public, anon, authenticated',
        t
      );
    end if;
  end loop;
end
$$;

-- Donnees de reference localisation (lecture uniquement).
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'region') then
    execute 'grant select on table public.region to authenticated';
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'prefecture') then
    execute 'grant select on table public.prefecture to authenticated';
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'commune') then
    execute 'grant select on table public.commune to authenticated';
  end if;
end
$$;

-- Membres / profils / partenariat.
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'profile') then
    execute 'grant select, insert, update on table public.profile to authenticated';
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'member') then
    execute 'grant select, insert, update on table public.member to authenticated';
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'organisation') then
    execute 'grant select, insert, update, delete on table public.organisation to authenticated';
  end if;
end
$$;

-- Communication / communaute / campagnes.
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'communication_team') then
    execute 'grant select, insert, update, delete on table public.communication_team to authenticated';
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'announcement') then
    execute 'grant select, insert, update, delete on table public.announcement to authenticated';
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'announcement_scope') then
    execute 'grant select, insert, update, delete on table public.announcement_scope to authenticated';
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'conversation') then
    execute 'grant select, insert, update, delete on table public.conversation to authenticated';
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'conversation_participant') then
    execute 'grant select, insert, update, delete on table public.conversation_participant to authenticated';
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'message') then
    execute 'grant select, insert, update, delete on table public.message to authenticated';
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'message_like') then
    execute 'grant select, insert, delete on table public.message_like to authenticated';
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'email_campaign') then
    execute 'grant select, insert, update, delete on table public.email_campaign to authenticated';
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'email_campaign_recipient') then
    execute 'grant select, insert, update, delete on table public.email_campaign_recipient to authenticated';
  end if;
end
$$;

-- Support + audit.
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'support_ai_chat') then
    execute 'grant select, insert on table public.support_ai_chat to authenticated';
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'member_contact_action') then
    execute 'grant select, insert on table public.member_contact_action to authenticated';
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'member_update') then
    execute 'grant select on table public.member_update to authenticated';
  end if;
end
$$;

commit;

-- Verification rapide apres hardening.
select
  grantee,
  table_name,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in (
    'region',
    'prefecture',
    'commune',
    'organisation',
    'profile',
    'member',
    'communication_team',
    'announcement',
    'announcement_scope',
    'conversation',
    'conversation_participant',
    'message',
    'message_like',
    'email_campaign',
    'email_campaign_recipient',
    'support_ai_chat',
    'member_contact_action',
    'member_update'
  )
  and grantee in ('anon', 'authenticated')
order by grantee, table_name, privilege_type;
