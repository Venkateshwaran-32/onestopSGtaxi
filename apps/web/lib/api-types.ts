import type { ForecastPoint, OperatorMeta, Quote } from '@onestopsgtaxi/shared';

export interface QuoteResponse {
  route: {
    distanceKm: number;
    durationMinutes: number;
    source: 'mapbox' | 'fallback';
    geometry?: { type: 'LineString'; coordinates: [number, number][] };
  };
  quotes: Array<Quote & { operator: OperatorMeta; forecast: ForecastPoint[] }>;
  generatedAt: string;
}

export interface QuoteError {
  error: string;
  details?: unknown;
}
