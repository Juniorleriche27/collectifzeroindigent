-- Email campaign smoke verification (production)
-- Run after creating a draft campaign, queueing it, and sending it.

-- A) Member eligibility snapshot
select
  coalesce(status::text, 'null') as member_status,
  count(*) as member_count
from public.member
group by coalesce(status::text, 'null')
order by member_status;

-- B) Campaign states
select
  id,
  subject,
  audience_scope,
  provider,
  status,
  created_at,
  scheduled_at,
  sent_at
from public.email_campaign
order by created_at desc
limit 20;

-- C) Recipient status by campaign
select
  campaign_id,
  status,
  count(*) as recipient_count
from public.email_campaign_recipient
group by campaign_id, status
order by campaign_id desc, status;

-- D) Last failed recipient errors (if any)
select
  campaign_id,
  recipient_email,
  status,
  error_message,
  sent_at,
  created_at
from public.email_campaign_recipient
where status = 'failed'
order by created_at desc
limit 50;
