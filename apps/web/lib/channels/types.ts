import type { OperatorMeta, Quote } from '@onestopsgtaxi/shared';

export interface ChannelMessage {
  title: string;
  bodyLines: string[];
  actionButtons?: Array<{ label: string; url: string }>;
}

export interface ChannelAdapter {
  name: 'telegram' | 'discord' | 'slack';
  isConfigured(): boolean;
  send(target: string, message: ChannelMessage): Promise<{ ok: boolean; error?: string }>;
}

export type EnrichedQuote = Quote & { operator: OperatorMeta };

export function buildQuoteMessage(args: {
  pickupLabel: string;
  dropoffLabel: string;
  distanceKm: number;
  durationMinutes: number;
  topQuotes: EnrichedQuote[];
}): ChannelMessage {
  const sgd = (n: number) => `S$${n.toFixed(2)}`;
  const lines = args.topQuotes.map(
    (q, i) =>
      `${i + 1}. ${q.operator.displayName} — ${sgd(q.fareSGD.mid)} · ~${q.etaMinutes}min`,
  );
  return {
    title: `🚕 ${args.pickupLabel} → ${args.dropoffLabel}`,
    bodyLines: [
      `${args.distanceKm.toFixed(1)} km · ~${args.durationMinutes} min driving`,
      '',
      ...lines,
      '',
      'Estimates only. Final fare is set by the operator.',
    ],
    actionButtons: args.topQuotes.map((q) => ({
      label: `Book on ${q.operator.displayName} — ${sgd(q.fareSGD.mid)}`,
      url: q.deeplink,
    })),
  };
}
