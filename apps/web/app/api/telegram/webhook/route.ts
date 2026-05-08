import { NextResponse } from 'next/server';
import {
  bootstrapEstimators,
  estimateAll,
} from '@onestopsgtaxi/pricing';
import { OPERATORS, buildDeeplink } from '@onestopsgtaxi/operators';
import type { OperatorId, Route } from '@onestopsgtaxi/shared';
import { getRoute } from '@/lib/routing';
import { parseVoiceQuery } from '@/lib/voice-parser';

bootstrapEstimators();

const TG_API = 'https://api.telegram.org';

interface TelegramMessage {
  message_id: number;
  chat: { id: number; first_name?: string };
  text?: string;
  from?: { username?: string };
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
}

interface InlineKeyboardButton {
  text: string;
  url?: string;
  callback_data?: string;
}

const SGD = (n: number) => `S$${n.toFixed(2)}`;

const HELP_TEXT =
  '🚕 *OneStopSGTaxi*\n\nSend a route in plain English:\n• `Orchard to Changi`\n• `from Bedok to Marina Bay Sands`\n• `Tampines to NUS`\n\nI\'ll reply with the three cheapest operators and one-tap deeplinks.';

async function tgSend(
  token: string,
  chatId: number,
  text: string,
  keyboard?: InlineKeyboardButton[][],
): Promise<void> {
  await fetch(`${TG_API}/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
      ...(keyboard ? { reply_markup: { inline_keyboard: keyboard } } : {}),
    }),
  }).catch((err) => {
    console.warn('[telegram] sendMessage failed:', err);
  });
}

export async function POST(req: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return NextResponse.json({ ok: true, dormant: true });
  }

  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (expectedSecret) {
    const got = req.headers.get('x-telegram-bot-api-secret-token');
    if (got !== expectedSecret) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }
  }

  let update: TelegramUpdate;
  try {
    update = (await req.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid json' }, { status: 400 });
  }

  const message = update.message ?? update.edited_message;
  if (!message?.text) return NextResponse.json({ ok: true });

  const chatId = message.chat.id;
  const text = message.text.trim();

  if (text === '/start' || text === '/help') {
    await tgSend(token, chatId, HELP_TEXT);
    return NextResponse.json({ ok: true });
  }

  const parsed = parseVoiceQuery(text);
  if (!parsed.pickup || !parsed.dropoff) {
    const hints: string[] = [];
    if (parsed.pickupHint) hints.push(`Got pickup hint: \`${parsed.pickupHint}\``);
    if (parsed.dropoffHint) hints.push(`Got dropoff hint: \`${parsed.dropoffHint}\``);
    await tgSend(
      token,
      chatId,
      [
        '🤔 I couldn\'t match that to a Singapore location.',
        ...hints,
        'Try a known landmark — e.g. `Orchard MRT to Changi Airport`.',
      ].join('\n\n'),
    );
    return NextResponse.json({ ok: true });
  }

  let routeInfo;
  try {
    routeInfo = await getRoute(parsed.pickup.coords, parsed.dropoff.coords);
  } catch (err) {
    console.warn('[telegram] routing failed:', err);
    await tgSend(token, chatId, '🚧 Could not compute route. Try again in a moment.');
    return NextResponse.json({ ok: true });
  }

  if (routeInfo.distanceKm < 0.1) {
    await tgSend(token, chatId, '🤷 Pickup and dropoff are at the same spot.');
    return NextResponse.json({ ok: true });
  }

  const route: Route = {
    pickup: parsed.pickup,
    dropoff: parsed.dropoff,
    distanceKm: routeInfo.distanceKm,
    durationMinutes: routeInfo.durationMinutes,
  };

  const allQuotes = estimateAll(route, { now: new Date() });
  allQuotes.sort((a, b) => a.fareSGD.mid - b.fareSGD.mid);
  const top = allQuotes.slice(0, 3);

  const lines = top.map((q, i) => {
    const op = OPERATORS[q.operatorId as OperatorId];
    const surge = q.surgeMultiplier > 1.05 ? ` _${q.surgeMultiplier}× surge_` : '';
    return `${i + 1}\\. *${op.displayName}* — ${SGD(q.fareSGD.mid)} · \\~${q.etaMinutes}min${surge}`;
  });

  const reply = [
    `🚕 *${parsed.pickup.label} → ${parsed.dropoff.label}*`,
    `${routeInfo.distanceKm.toFixed(1)} km · \\~${routeInfo.durationMinutes} min driving`,
    '',
    ...lines,
    '',
    '_Estimates only. Final fare set by the operator._',
  ].join('\n');

  const keyboard: InlineKeyboardButton[][] = top.map((q) => {
    const op = OPERATORS[q.operatorId as OperatorId];
    return [
      {
        text: `🚕 Book on ${op.displayName} — ${SGD(q.fareSGD.mid)}`,
        url: buildDeeplink(q.operatorId as OperatorId, {
          pickup: parsed.pickup!,
          dropoff: parsed.dropoff!,
          ref: 'onestopsgtaxi-tg',
        }),
      },
    ];
  });

  await tgSend(token, chatId, reply, keyboard);
  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    dormant: !process.env.TELEGRAM_BOT_TOKEN,
    setup: {
      step1: 'Talk to @BotFather on Telegram → /newbot → save the token',
      step2: 'Set TELEGRAM_BOT_TOKEN env var on the deployment',
      step3: 'Optionally set TELEGRAM_WEBHOOK_SECRET for webhook auth',
      step4:
        'Register webhook: POST to https://api.telegram.org/bot<TOKEN>/setWebhook with url=https://<your-domain>/api/telegram/webhook (and secret_token if used)',
    },
  });
}
