import { NextResponse } from 'next/server';
import { z } from 'zod';
import { loadTopology } from '@/lib/transit/load-topology';
import { fetchManyArrivals, LtaConfigError } from '@/lib/transit/lta';
import { nearestStops, type BusStopRow, type TopologyIndex } from '@/lib/transit/topology';
import {
  planTransit,
  uniqueStopCodesFromCandidates,
  type TransitItinerary,
} from '@/lib/transit/plan';
import { getPolylineForLeg } from '@/lib/transit/polylines';

const PointSchema = z.union([
  z.object({
    busStopCode: z.string().regex(/^\d{5}$/),
  }),
  z.object({
    lat: z.number().gte(-90).lte(90),
    lng: z.number().gte(-180).lte(180),
    label: z.string().optional(),
  }),
]);

const PlanSchema = z.object({
  origin: PointSchema,
  dest: PointSchema,
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid json' }, { status: 400 });
  }

  const parsed = PlanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'validation_failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { origin, dest } = parsed.data;
  const { index, source } = await loadTopology();

  const originPoint = 'busStopCode' in origin
    ? { busStopCode: origin.busStopCode }
    : { coords: { lat: origin.lat, lng: origin.lng } };
  const destPoint = 'busStopCode' in dest
    ? { busStopCode: dest.busStopCode }
    : { coords: { lat: dest.lat, lng: dest.lng } };

  const seedItineraries = planTransit({
    topology: index,
    arrivals: new Map(),
    origin: originPoint,
    dest: destPoint,
  });

  const candidateStopCodes = uniqueStopCodesFromCandidates(seedItineraries);
  let extraCodes: string[] = [];
  if ('coords' in originPoint && originPoint.coords) {
    extraCodes = nearestStops(index, originPoint.coords).map((r) => r.stop.code);
  }
  if ('coords' in destPoint && destPoint.coords) {
    extraCodes = extraCodes.concat(
      nearestStops(index, destPoint.coords).map((r) => r.stop.code),
    );
  }

  const allCodes = Array.from(new Set([...candidateStopCodes, ...extraCodes]));

  let arrivals = new Map();
  let liveDataAvailable = false;
  let configMessage: string | null = null;

  if (allCodes.length > 0) {
    try {
      arrivals = await fetchManyArrivals(allCodes);
      liveDataAvailable = arrivals.size > 0;
    } catch (err) {
      if (err instanceof LtaConfigError) {
        configMessage = err.message;
      } else {
        configMessage = err instanceof Error ? err.message : 'arrivals fetch failed';
      }
    }
  }

  const finalItineraries = planTransit({
    topology: index,
    arrivals,
    origin: originPoint,
    dest: destPoint,
  });

  await attachPolylines(finalItineraries);

  const originStop = resolveOriginStop(index, originPoint);

  return NextResponse.json({
    ok: true,
    topologySource: source,
    liveDataAvailable,
    configMessage,
    originStopCode: originStop?.code ?? null,
    originStopName: originStop?.name ?? null,
    itineraries: finalItineraries,
    note:
      source === 'demo'
        ? 'Using demo topology (Depot Rd corridor). Run `pnpm topology:fetch` after setting LTA_DATAMALL_KEY for full SG coverage.'
        : null,
  });
}

async function attachPolylines(itineraries: TransitItinerary[]): Promise<void> {
  // Collect every (serviceNo, fromCode, toCode) request needed across all
  // itineraries; dedupe so we don't repeat work for shared bus legs.
  const jobs = new Map<string, { serviceNo: string; fromCode: string; toCode: string }>();
  for (const it of itineraries) {
    for (const leg of it.legs) {
      if (leg.mode !== 'bus' || !leg.serviceNo || !leg.fromCode || !leg.toCode) continue;
      const key = `${leg.serviceNo}:${leg.fromCode}:${leg.toCode}`;
      if (!jobs.has(key)) {
        jobs.set(key, {
          serviceNo: leg.serviceNo,
          fromCode: leg.fromCode,
          toCode: leg.toCode,
        });
      }
    }
  }

  if (jobs.size === 0) return;

  const entries = Array.from(jobs.entries());
  const resolved = await Promise.all(
    entries.map(async ([key, j]) => {
      try {
        const poly = await getPolylineForLeg(j.serviceNo, j.fromCode, j.toCode);
        return [key, poly] as const;
      } catch {
        return [key, null] as const;
      }
    }),
  );
  const lookup = new Map(resolved);

  for (const it of itineraries) {
    for (const leg of it.legs) {
      if (leg.mode !== 'bus' || !leg.serviceNo || !leg.fromCode || !leg.toCode) continue;
      const key = `${leg.serviceNo}:${leg.fromCode}:${leg.toCode}`;
      const poly = lookup.get(key);
      if (poly) leg.polyline = poly;
    }
  }
}

function resolveOriginStop(
  index: TopologyIndex,
  origin: { busStopCode?: string; coords?: { lat: number; lng: number } },
): BusStopRow | null {
  if (origin.busStopCode) {
    return index.stopsByCode.get(origin.busStopCode) ?? null;
  }
  if (!origin.coords) return null;
  const nearest = nearestStops(index, origin.coords);
  return nearest[0]?.stop ?? null;
}

export async function GET() {
  const hasKey = !!process.env.LTA_DATAMALL_KEY;
  const { source } = await loadTopology();
  return NextResponse.json({
    ok: true,
    serverMode: hasKey ? 'live' : 'topology_only',
    topologySource: source,
    setup: hasKey
      ? null
      : {
          step1: 'Sign up at https://datamall.lta.gov.sg/ to get a free API key',
          step2: 'Set LTA_DATAMALL_KEY env var on Vercel (or .env.local)',
          step3: '(Optional) Run `pnpm topology:fetch` once locally to bundle full SG topology',
        },
  });
}
