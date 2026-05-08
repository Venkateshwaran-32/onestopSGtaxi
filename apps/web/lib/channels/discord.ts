import type { ChannelAdapter, ChannelMessage } from './types';

export const discordAdapter: ChannelAdapter = {
  name: 'discord',
  isConfigured() {
    return !!process.env.DISCORD_WEBHOOK_URL;
  },
  async send(_target, message) {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) return { ok: false, error: 'no webhook configured' };

    const description = [
      ...message.bodyLines,
      '',
      ...(message.actionButtons ?? []).map((b) => `• [${b.label}](${b.url})`),
    ].join('\n');

    const payload = {
      embeds: [
        {
          title: message.title,
          description,
          color: 0x10b981,
          footer: { text: 'OneStopSGTaxi' },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return { ok: false, error: `discord ${res.status}` };
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'discord fetch failed' };
    }
  },
};
