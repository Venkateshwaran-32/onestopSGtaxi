import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Circle } from 'lucide-react';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

interface HealthResponse {
  ok: boolean;
  productMode: string;
  uptimeSeconds: number;
  version: string;
  deploymentEnv: string;
  services: Record<string, 'configured' | 'dormant'>;
  topology: { source: string; stops: number };
  generatedAt: string;
}

const SERVICE_LABELS: Record<string, string> = {
  supabase: 'Supabase (auth + crowd calibration storage)',
  lta_datamall: 'LTA DataMall (live bus arrivals)',
  mapbox: 'Mapbox (real road routing)',
  google_places: 'Google Places (full address autocomplete)',
  posthog: 'PostHog (anonymous analytics)',
  telegram: 'Telegram bot (chat-to-quote)',
  discord: 'Discord webhook (channel adapter)',
  slack: 'Slack webhook (channel adapter)',
  vapid: 'Web push (Pin & Watch alerts)',
  cron_secret: 'Cron secret (locks down cron endpoints)',
};

const SERVICE_NOTES: Record<string, string> = {
  supabase: 'Falls back to localStorage-only when dormant. Run docs/migrations/0001 + 0002 SQL when ready.',
  lta_datamall: 'Falls back to headway estimates when dormant. Sign up at datamall.lta.gov.sg.',
  mapbox: 'Falls back to haversine + 1.35 road factor when dormant.',
  google_places: 'Falls back to a curated 20-place SG list when dormant.',
  posthog: 'No-op when dormant — analytics calls just skip.',
  telegram: 'Webhook returns ok-dormant when unset.',
  discord: 'No outbound posts when unset.',
  slack: 'No outbound posts when unset.',
  vapid: 'Subscribe button is hidden when dormant.',
  cron_secret: 'When set, cron endpoints require Bearer auth.',
};

async function fetchHealth(): Promise<HealthResponse | null> {
  const h = await headers();
  const host = h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? 'http';
  try {
    const res = await fetch(`${proto}://${host}/api/health`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as HealthResponse;
  } catch {
    return null;
  }
}

export default async function AdminHealthPage() {
  const data = await fetchHealth();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-5 pb-10 pt-4 sm:px-8 sm:pt-8">
      <header className="flex items-center gap-3">
        <Link
          href="/"
          aria-label="Back to home"
          className="inline-flex size-9 items-center justify-center rounded-md hover:bg-accent"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <h1 className="flex-1 text-base font-semibold">System health</h1>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider">
          {data?.deploymentEnv ?? 'unknown'}
        </span>
      </header>

      {!data ? (
        <p className="mt-8 text-sm text-destructive">Could not reach /api/health.</p>
      ) : (
        <>
          <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Product mode" value={data.productMode} />
            <Stat label="Topology" value={`${data.topology.stops.toLocaleString()} stops · ${data.topology.source}`} />
            <Stat label="Uptime" value={fmtUptime(data.uptimeSeconds)} />
            <Stat label="Version" value={(data.version ?? 'dev').slice(0, 8)} />
          </section>

          <section className="mt-8">
            <h2 className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Services
            </h2>
            <ul className="mt-3 space-y-1">
              {Object.entries(data.services).map(([key, status]) => (
                <li
                  key={key}
                  className="flex items-start gap-3 rounded-lg border bg-card px-3 py-2.5"
                >
                  {status === 'configured' ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                  ) : (
                    <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground/40" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{SERVICE_LABELS[key] ?? key}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {SERVICE_NOTES[key]}
                    </p>
                  </div>
                  <span
                    className={
                      'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ' +
                      (status === 'configured'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                        : 'bg-secondary text-muted-foreground')
                    }
                  >
                    {status}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <p className="mt-8 text-[10px] text-muted-foreground">
            Snapshot at {new Date(data.generatedAt).toLocaleString('en-SG')}. Page is
            server-rendered fresh on every request.
          </p>
        </>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 truncate font-mono text-sm font-medium">{value}</p>
    </div>
  );
}

function fmtUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  if (seconds < 86400) return `${(seconds / 3600).toFixed(1)}h`;
  return `${(seconds / 86400).toFixed(1)}d`;
}
