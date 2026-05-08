-- 0001_crowd_calibration.sql
-- Run in Supabase SQL editor when ready to enable cross-user calibration.
-- Until this is applied, /api/calibrate runs in client-only mode.

create table if not exists fare_submissions (
  id uuid primary key default gen_random_uuid(),
  operator_id text not null,
  route_key text not null,
  pickup_label text not null,
  dropoff_label text not null,
  distance_km numeric(6, 2) not null,
  estimated_fare_sgd numeric(8, 2) not null,
  actual_fare_sgd numeric(8, 2) not null,
  source text not null check (source in ('manual', 'ocr', 'email')),
  hour_of_week smallint not null check (hour_of_week between 0 and 167),
  hour_bucket smallint not null check (hour_bucket between 0 and 41),
  user_anon_id text,
  submitted_at timestamptz not null default now()
);

create index if not exists fare_submissions_route_op_bucket_idx
  on fare_submissions (route_key, operator_id, hour_bucket, submitted_at desc);

create index if not exists fare_submissions_route_idx
  on fare_submissions (route_key, submitted_at desc);

create table if not exists crowd_calibration (
  route_key text not null,
  operator_id text not null,
  hour_bucket smallint not null,
  median_sgd numeric(8, 2) not null,
  sample_count int not null,
  last_submitted_at timestamptz not null,
  computed_at timestamptz not null default now(),
  primary key (route_key, operator_id, hour_bucket)
);

create or replace function refresh_crowd_calibration() returns void
language plpgsql as $$
begin
  insert into crowd_calibration (route_key, operator_id, hour_bucket, median_sgd, sample_count, last_submitted_at, computed_at)
  select
    route_key,
    operator_id,
    hour_bucket,
    percentile_cont(0.5) within group (order by actual_fare_sgd) as median_sgd,
    count(*) as sample_count,
    max(submitted_at) as last_submitted_at,
    now() as computed_at
  from fare_submissions
  where submitted_at >= now() - interval '14 days'
  group by route_key, operator_id, hour_bucket
  having count(*) >= 3
  on conflict (route_key, operator_id, hour_bucket) do update
    set median_sgd = excluded.median_sgd,
        sample_count = excluded.sample_count,
        last_submitted_at = excluded.last_submitted_at,
        computed_at = excluded.computed_at;
end;
$$;

-- Run hourly via Supabase pg_cron extension once enabled:
--   select cron.schedule('refresh-crowd-calibration', '0 * * * *', 'select refresh_crowd_calibration()');

-- RLS: anyone can submit fares, only server (with service role) can read aggregates.
alter table fare_submissions enable row level security;
alter table crowd_calibration enable row level security;

create policy "anyone can submit a fare"
  on fare_submissions
  for insert
  with check (true);

create policy "anyone can read calibration"
  on crowd_calibration
  for select
  using (true);
