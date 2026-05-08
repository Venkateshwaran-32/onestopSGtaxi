import type { ChannelAdapter } from './types';

export const slackAdapter: ChannelAdapter = {
  name: 'slack',
  isConfigured() {
    return !!process.env.SLACK_WEBHOOK_URL;
  },
  async send(_target, message) {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) return { ok: false, error: 'no webhook configured' };

    const blocks: Array<Record<string, unknown>> = [
      {
        type: 'header',
        text: { type: 'plain_text', text: message.title, emoji: true },
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: message.bodyLines.join('\n') || ' ' },
      },
    ];

    if (message.actionButtons && message.actionButtons.length > 0) {
      blocks.push({
        type: 'actions',
        elements: message.actionButtons.slice(0, 5).map((b, i) => ({
          type: 'button',
          text: { type: 'plain_text', text: b.label, emoji: true },
          url: b.url,
          action_id: `book_${i}`,
        })),
      });
    }

    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks, text: message.title }),
      });
      if (!res.ok) return { ok: false, error: `slack ${res.status}` };
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'slack fetch failed' };
    }
  },
};
