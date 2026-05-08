import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getPublicVapidKey } from '@/lib/push/vapid';
import { getSubscriptionStore } from '@/lib/push/store';

const SubscribeSchema = z.object({
  ownerKey: z.string().min(8).max(128),
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string().min(1),
      auth: z.string().min(1),
    }),
  }),
  pinTags: z.array(z.string()).max(50).optional(),
});

export async function GET() {
  const publicKey = getPublicVapidKey();
  return NextResponse.json({
    ok: true,
    publicKey,
    enabled: !!publicKey,
    setup: publicKey
      ? null
      : {
          step1: 'Generate VAPID keys: pnpm dlx web-push generate-vapid-keys',
          step2: 'Set NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT env vars',
          step3: 'Redeploy. Subscribe button appears on /saved.',
        },
  });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid json' }, { status: 400 });
  }
  const parsed = SubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'validation_failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const store = getSubscriptionStore();
  await store.upsert({
    endpoint: parsed.data.subscription.endpoint,
    ownerKey: parsed.data.ownerKey,
    keys: parsed.data.subscription.keys,
    pinTags: parsed.data.pinTags ?? [],
    createdAt: new Date().toISOString(),
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid json' }, { status: 400 });
  }
  const schema = z.object({
    ownerKey: z.string().min(8).max(128),
    endpoint: z.string().url(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'validation_failed' }, { status: 400 });
  }
  const store = getSubscriptionStore();
  await store.remove(parsed.data.endpoint, parsed.data.ownerKey);
  return NextResponse.json({ ok: true });
}
