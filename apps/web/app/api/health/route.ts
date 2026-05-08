import { NextResponse } from 'next/server';
import { loadTopology } from '@/lib/transit/load-topology';

const startupTime = Date.now();

type Status = 'configured' | 'dormant';

function envStatus(...keys: string[]): Status {
  return keys.every((k) => !!process.env[k]) ? 'configured' : 'dormant';
}

export async function GET() {
  const services = {
    supabase: envStatus('NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'),
    lta_datamall: envStatus('LTA_DATAMALL_KEY'),
    mapbox: envStatus('MAPBOX_ACCESS_TOKEN'),
    google_places: envStatus('NEXT_PUBLIC_GOOGLE_PLACES_KEY'),
    posthog: envStatus('NEXT_PUBLIC_POSTHOG_KEY'),
    telegram: envStatus('TELEGRAM_BOT_TOKEN'),
    discord: envStatus('DISCORD_WEBHOOK_URL'),
    slack: envStatus('SLACK_WEBHOOK_URL'),
    vapid: envStatus('NEXT_PUBLIC_VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'VAPID_SUBJECT'),
    cron_secret: envStatus('CRON_SECRET'),
  };

  let topology: { source: string; stops: number } = { source: 'unknown', stops: 0 };
  try {
    const { index, source } = await loadTopology();
    topology = { source, stops: index.stops.length };
  } catch {
    topology = { source: 'error', stops: 0 };
  }

  const productMode = process.env.NEXT_PUBLIC_PRODUCT_MODE ?? 'taxi';

  return NextResponse.json({
    ok: true,
    productMode,
    uptimeSeconds: Math.round((Date.now() - startupTime) / 1000),
    version: process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.npm_package_version ?? 'dev',
    deploymentEnv: process.env.VERCEL_ENV ?? 'development',
    services,
    topology,
    generatedAt: new Date().toISOString(),
  });
}
