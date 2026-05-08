-- 0002_feedback.sql
-- Run in Supabase SQL editor when you want feedback persisted server-side.
-- Until applied, /api/feedback runs in client_only mode.

create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  rating smallint check (rating between 1 and 5),
  worked text,
  broke_or_confused text,
  contact text,
  page_context text,
  user_agent text,
  submitted_at timestamptz not null default now()
);

create index if not exists feedback_submitted_at_idx
  on feedback (submitted_at desc);

alter table feedback enable row level security;

create policy "anyone can submit feedback"
  on feedback
  for insert
  with check (true);
