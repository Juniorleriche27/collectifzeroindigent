-- Support IA Cohere: historique questions/reponses par utilisateur
-- Execution: Supabase SQL Editor

begin;

create table if not exists public.support_ai_chat (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  member_id uuid null references public.member(id) on delete set null,
  question text not null,
  answer text not null,
  provider text not null default 'cohere',
  model text null,
  created_at timestamptz not null default now(),
  constraint support_ai_chat_question_not_blank check (char_length(trim(question)) > 0),
  constraint support_ai_chat_answer_not_blank check (char_length(trim(answer)) > 0)
);

create index if not exists support_ai_chat_user_created_idx
  on public.support_ai_chat (user_id, created_at desc);

create index if not exists support_ai_chat_member_created_idx
  on public.support_ai_chat (member_id, created_at desc);

alter table public.support_ai_chat enable row level security;

drop policy if exists support_ai_chat_select_own on public.support_ai_chat;
create policy support_ai_chat_select_own
  on public.support_ai_chat
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists support_ai_chat_insert_own on public.support_ai_chat;
create policy support_ai_chat_insert_own
  on public.support_ai_chat
  for insert
  to authenticated
  with check (auth.uid() = user_id);

grant select, insert on public.support_ai_chat to authenticated;

commit;

