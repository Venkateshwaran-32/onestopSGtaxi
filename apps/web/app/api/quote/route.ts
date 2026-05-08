import { NextResponse } from 'next/server';
import { z } from 'zod';
import { bootstrapEstimators, estimateAll } from '@onestopsgtaxi/pricing';
import { OPERATORS, buildDeeplink } from '@onestopsgtaxi/operators';
import type { Quote, Route } from '@onestopsgtaxi/shared';
import { getRoute } from '@/lib/routing';

bootstrapEstimators();

const PlaceSchema = z.object({
  label: z.string().min(1),
  address: z.string().min(1),
  coords: z.object({
    lat: z.number().gte(-90).lte(90),
    lng: z.number().gte(-180).lte(180),
  }),
  placeId: z.string().optional(),
});

const QuoteRequestSchema = z.object({
  pickup: PlaceSchema,
  dropoff: PlaceSchema,
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  const parsed = QuoteRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid request', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { pickup, dropoff } = parsed.data;

  const routeInfo = await getRoute(pickup.coords, dropoff.coords);

  if (routeInfo.distanceKm < 0.05) {
    return NextResponse.json(
      { error: 'pickup and dropoff are at the same location' },
      { status: 400 },
    );
  }

  const route: Route = {
    pickup,
    dropoff,
    distanceKm: routeInfo.distanceKm,
    durationMinutes: routeInfo.durationMinutes,
  };

  const ctx = { now: new Date() };

  const quotesRaw: Quote[] = estimateAll(route, ctx);
  const quotes = quotesRaw.map((q) => ({
    ...q,
    deeplink: buildDeeplink(q.operatorId, { pickup, dropoff, ref: 'onestopsgtaxi' }),
    operator: OPERATORS[q.operatorId],
  }));

  quotes.sort((a, b) => a.fareSGD.mid - b.fareSGD.mid);

  return NextResponse.json({
    route: {
      distanceKm: routeInfo.distanceKm,
      durationMinutes: routeInfo.durationMinutes,
      source: routeInfo.source,
    },
    quotes,
    generatedAt: ctx.now.toISOString(),
  });
}
