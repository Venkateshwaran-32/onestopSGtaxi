import type { OperatorMeta, Quote } from '@onestopsgtaxi/shared';

export interface QuoteResponse {
  route: {
    distanceKm: number;
    durationMinutes: number;
    source: 'mapbox' | 'fallback';
  };
  quotes: Array<Quote & { operator: OperatorMeta }>;
  generatedAt: string;
}

export interface QuoteError {
  error: string;
  details?: unknown;
}
