import { NextResponse } from 'next/server';
import { getVapidConfig } from '@/lib/push/vapid';
import { getSubscriptionStore } from '@/lib/push/store';

export const runtime = 'nodejs';

interface CronAuthOk {
  ok: true;
}
interface CronAuthFail {
  ok: false;
  status: number;
  error: string;
}

function authorizeCron(req: Request): CronAuthOk | CronAuthFail {
  const expected = process.env.CRON_SECRET;
  if (!expected) return { ok: true };
  const auth = req.headers.get('authorization');
  if (auth === `Bearer ${expected}`) return { ok: true };
  return { ok: false, status: 401, error: 'unauthorized' };
}

export async function GET(req: Request) {
  const auth = authorizeCron(req);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const config = getVapidConfig();
  if (!config) {
    return NextResponse.json({
      ok: true,
      mode: 'dormant',
      reason: 'VAPID env vars not set',
    });
  }

  let webpushModule;
  try {
    webpushModule = (await import('web-push')).default;
  } catch {
    return NextResponse.json({
      ok: false,
      error: 'web-push module not available',
    });
  }

  webpushModule.setVapidDetails(config.subject, config.publicKey, config.privateKey);

  const store = getSubscriptionStore();
  const subscriptions = await store.listAll();

  // V1: simple ping payload. The actual "is target met" check requires the
  // user's pinned routes + live quote computation per subscription. That's
  // wired in plans/03 A5 (saved transit hops). For now we no-op when there's
  // no real signal to send.

  let attempted = 0;
  let succeeded = 0;
  let removed = 0;

  for (const sub of subscriptions) {
    if (sub.pinTags.length === 0) continue;
    attempted++;
    try {
      await webpushModule.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: sub.keys,
        },
        JSON.stringify({
          title: 'OneStopSGTaxi',
          body: 'Crown poll keep-alive — full surge detection ships in V1.1',
          tag: 'cron-keep-alive',
          data: { url: '/saved' },
        }),
      );
      succeeded++;
    } catch (err) {
      const e = err as { statusCode?: number };
      if (e.statusCode === 410 || e.statusCode === 404) {
        await store.remove(sub.endpoint, sub.ownerKey);
        removed++;
      }
    }
  }

  return NextResponse.json({
    ok: true,
    mode: 'live',
    subscriptionsTotal: subscriptions.length,
    attempted,
    succeeded,
    removed,
    ranAt: new Date().toISOString(),
  });
}
