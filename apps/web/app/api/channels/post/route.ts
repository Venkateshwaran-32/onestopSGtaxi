import { NextResponse } from 'next/server';
import { z } from 'zod';
import { configuredChannels, getChannel } from '@/lib/channels';

const PostSchema = z.object({
  channel: z.enum(['discord', 'slack']).optional(),
  title: z.string().min(1).max(200),
  bodyLines: z.array(z.string()).max(20),
  actionButtons: z
    .array(z.object({ label: z.string(), url: z.string().url() }))
    .max(5)
    .optional(),
});

function authorize(req: Request): boolean {
  const expected = process.env.CHANNEL_POST_SECRET;
  if (!expected) return true;
  return req.headers.get('authorization') === `Bearer ${expected}`;
}

export async function POST(req: Request) {
  if (!authorize(req)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid json' }, { status: 400 });
  }
  const parsed = PostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'validation_failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const targets = parsed.data.channel
    ? [getChannel(parsed.data.channel)].filter((c): c is NonNullable<typeof c> => c !== null)
    : configuredChannels();

  if (targets.length === 0) {
    return NextResponse.json({
      ok: true,
      sent: 0,
      mode: 'no_channels_configured',
      hint: 'Set DISCORD_WEBHOOK_URL or SLACK_WEBHOOK_URL env vars to enable.',
    });
  }

  const results = await Promise.all(
    targets.map(async (ch) => {
      if (!ch.isConfigured()) return { channel: ch.name, ok: false, error: 'not_configured' };
      const r = await ch.send('default', {
        title: parsed.data.title,
        bodyLines: parsed.data.bodyLines,
        actionButtons: parsed.data.actionButtons,
      });
      return { channel: ch.name, ...r };
    }),
  );

  return NextResponse.json({
    ok: true,
    sent: results.filter((r) => r.ok).length,
    results,
  });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    available: configuredChannels().map((c) => c.name),
    setup: {
      discord: 'Server settings → Integrations → Webhooks → set DISCORD_WEBHOOK_URL',
      slack: 'Workspace settings → Apps → Incoming Webhooks → set SLACK_WEBHOOK_URL',
      auth: '(optional) Set CHANNEL_POST_SECRET to require Bearer auth on POST',
    },
  });
}
