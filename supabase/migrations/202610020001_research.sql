create table public.research_responses (
  submission_id uuid primary key,
  created_at timestamptz not null default now(),
  answers jsonb not null check (jsonb_typeof(answers) = 'object'),
  email text check (email is null or (length(email) <= 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')),
  email_consent boolean not null default false,
  research_consent boolean not null check (research_consent),
  consent_version text not null,
  survey_version text not null,
  currency text not null check (currency = 'USD'),
  check ((email is null and not email_consent) or (email is not null and email_consent))
);
alter table public.research_responses enable row level security;
revoke all on public.research_responses from anon, authenticated;
grant insert, select, delete on public.research_responses to service_role;
-- No public policies: only the validated Edge Function can write.
create index research_responses_created_at_idx on public.research_responses(created_at);
-- Enable pg_cron in Supabase, then run once to enforce the stated retention:
-- select cron.schedule('research-retention', '0 3 * * *',
--   $$delete from public.research_responses where created_at < now() - interval '12 months'$$);
