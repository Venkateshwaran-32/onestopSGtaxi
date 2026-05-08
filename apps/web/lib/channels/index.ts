import { discordAdapter } from './discord';
import { slackAdapter } from './slack';
import type { ChannelAdapter } from './types';

export const channels: ChannelAdapter[] = [discordAdapter, slackAdapter];

export function configuredChannels(): ChannelAdapter[] {
  return channels.filter((c) => c.isConfigured());
}

export function getChannel(name: ChannelAdapter['name']): ChannelAdapter | null {
  return channels.find((c) => c.name === name) ?? null;
}

export { buildQuoteMessage } from './types';
export type { ChannelAdapter, ChannelMessage, EnrichedQuote } from './types';
