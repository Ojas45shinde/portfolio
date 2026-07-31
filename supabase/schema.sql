-- Run this once in Supabase → SQL Editor.

create table if not exists portfolio_data (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table portfolio_data enable row level security;

-- Anyone (including anonymous visitors) can read — this is public
-- portfolio content, meant to be seen.
create policy "Public can read portfolio data"
  on portfolio_data for select
  using (true);

-- No insert/update/delete policy is created for the anon or authenticated
-- roles on purpose. The ONLY way to write is through the portfolio-write
-- Edge Function, which uses the service-role key (which bypasses RLS)
-- after checking the owner passcode. This means even someone who opens
-- devtools and finds the anon key cannot write directly to this table.
