-- 0003_push_subscriptions.sql
-- Run in Supabase SQL editor when you want push subscriptions persisted server-side.
-- Until applied, the push store falls back to in-memory map (lost on every deploy).

create table if not exists push_subscriptions (
  endpoint text not null,
  owner_key text not null,
  keys jsonb not null,
  pin_tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  primary key (endpoint, owner_key)
);

create index if not exists push_subscriptions_owner_idx
  on push_subscriptions (owner_key);

alter table push_subscriptions enable row level security;
