interface DataMallNextBus {
  EstimatedArrival: string;
  Latitude?: string;
  Longitude?: string;
  VisitNumber?: string;
  Load?: 'SEA' | 'SDA' | 'LSD';
  Feature?: string;
  Type?: 'SD' | 'DD' | 'BD';
}

interface DataMallServiceArrival {
  ServiceNo: string;
  Operator?: string;
  NextBus: DataMallNextBus;
  NextBus2: DataMallNextBus;
  NextBus3: DataMallNextBus;
}

interface DataMallArrivalResponse {
  BusStopCode: string;
  Services: DataMallServiceArrival[];
}

const DATAMALL_BASE = 'https://datamall2.mytransport.sg/ltaodataservice';
const ARRIVAL_TTL_MS = 18 * 1000;

const cache = new Map<string, { data: ArrivalLookup; ts: number }>();

export type LoadLevel = 'low' | 'medium' | 'high' | 'unknown';

export interface ArrivalSlot {
  estimatedArrivalAt: Date | null;
  etaMinutes: number | null;
  load: LoadLevel;
  type?: 'single_deck' | 'double_deck' | 'bendy';
}

export interface ServiceArrival {
  serviceNo: string;
  arrivals: [ArrivalSlot, ArrivalSlot, ArrivalSlot];
}

export interface ArrivalLookup {
  busStopCode: string;
  fetchedAt: Date;
  services: Record<string, ServiceArrival>;
}

function decodeLoad(raw?: string): LoadLevel {
  if (!raw) return 'unknown';
  if (raw === 'SEA') return 'low';
  if (raw === 'SDA') return 'medium';
  if (raw === 'LSD') return 'high';
  return 'unknown';
}

function decodeType(raw?: string): ArrivalSlot['type'] {
  if (!raw) return undefined;
  if (raw === 'SD') return 'single_deck';
  if (raw === 'DD') return 'double_deck';
  if (raw === 'BD') return 'bendy';
  return undefined;
}

function decodeSlot(slot: DataMallNextBus, now: Date): ArrivalSlot {
  if (!slot?.EstimatedArrival) {
    return { estimatedArrivalAt: null, etaMinutes: null, load: 'unknown' };
  }
  const at = new Date(slot.EstimatedArrival);
  if (Number.isNaN(at.getTime())) {
    return { estimatedArrivalAt: null, etaMinutes: null, load: decodeLoad(slot.Load) };
  }
  const etaMinutes = Math.round((at.getTime() - now.getTime()) / 60_000);
  return {
    estimatedArrivalAt: at,
    etaMinutes,
    load: decodeLoad(slot.Load),
    type: decodeType(slot.Type),
  };
}

export class LtaConfigError extends Error {}

export async function fetchArrivals(busStopCode: string): Promise<ArrivalLookup> {
  const key = process.env.LTA_DATAMALL_KEY;
  if (!key) {
    throw new LtaConfigError(
      'LTA_DATAMALL_KEY is not set. Sign up at https://datamall.lta.gov.sg/ and set the env var.',
    );
  }

  const now = Date.now();
  const cached = cache.get(busStopCode);
  if (cached && now - cached.ts < ARRIVAL_TTL_MS) {
    return cached.data;
  }

  const url = `${DATAMALL_BASE}/v3/BusArrival?BusStopCode=${encodeURIComponent(busStopCode)}`;
  const res = await fetch(url, {
    headers: { AccountKey: key, accept: 'application/json' },
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    throw new Error(`LTA BusArrival ${res.status}: ${await res.text().catch(() => '')}`);
  }
  const json = (await res.json()) as DataMallArrivalResponse;
  const fetchedAt = new Date();
  const services: Record<string, ServiceArrival> = {};
  for (const svc of json.Services ?? []) {
    services[svc.ServiceNo] = {
      serviceNo: svc.ServiceNo,
      arrivals: [
        decodeSlot(svc.NextBus, fetchedAt),
        decodeSlot(svc.NextBus2, fetchedAt),
        decodeSlot(svc.NextBus3, fetchedAt),
      ],
    };
  }
  const result: ArrivalLookup = {
    busStopCode: json.BusStopCode ?? busStopCode,
    fetchedAt,
    services,
  };
  cache.set(busStopCode, { data: result, ts: now });
  return result;
}

export async function fetchManyArrivals(stopCodes: string[]): Promise<Map<string, ArrivalLookup>> {
  const out = new Map<string, ArrivalLookup>();
  const unique = Array.from(new Set(stopCodes));
  const results = await Promise.allSettled(unique.map((code) => fetchArrivals(code)));
  results.forEach((r, i) => {
    const code = unique[i]!;
    if (r.status === 'fulfilled') out.set(code, r.value);
  });
  return out;
}

export function nextSlotAfter(
  arrival: ServiceArrival | undefined,
  notBeforeMinutes: number,
): ArrivalSlot | null {
  if (!arrival) return null;
  for (const slot of arrival.arrivals) {
    if (slot.etaMinutes != null && slot.etaMinutes >= notBeforeMinutes) return slot;
  }
  const last = arrival.arrivals[arrival.arrivals.length - 1];
  if (last && last.etaMinutes != null) return last;
  return null;
}
