begin;

create index if not exists idx_donation_payment_ref
  on public.donation (payment_ref)
  where payment_ref is not null;

create index if not exists idx_member_card_request_payment_ref
  on public.member_card_request (payment_ref)
  where payment_ref is not null;

commit;

select
  schemaname,
  tablename,
  indexname
from pg_indexes
where schemaname = 'public'
  and indexname in (
    'idx_donation_payment_ref',
    'idx_member_card_request_payment_ref'
  )
order by indexname;

