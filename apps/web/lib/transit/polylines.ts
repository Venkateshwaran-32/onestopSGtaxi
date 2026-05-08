import type { LatLng } from '@onestopsgtaxi/shared';
import { haversineDistanceKm } from '../geo';
import { loadTopology } from './load-topology';

/**
 * Polyline cache + decoder.
 *
 * Source: https://data.busrouter.sg/v1/routes.min.json
 *   Community-mirrored LTA Open Data, ~280 KB, served with permissive CORS.
 *   Singapore Open Data Licence (commercial use OK).
 *
 * Format: { "<serviceNo>": [ "<encoded polyline dir1>", "<encoded polyline dir2>" ] }
 *
 * Encoded with Google's polyline algorithm at precision 5.
 */

const ROUTES_URL = 'https://data.busrouter.sg/v1/routes.min.json';
const ROUTES_TTL_MS = 24 * 60 * 60 * 1000; // 24h — service polylines are very stable.

interface RoutesPayload {
  [serviceNo: string]: string[];
}

let cache: { data: RoutesPayload; ts: number } | null = null;
let inflight: Promise<RoutesPayload> | null = null;

async function loadAllRoutes(): Promise<RoutesPayload> {
  const now = Date.now();
  if (cache && now - cache.ts < ROUTES_TTL_MS) return cache.data;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const res = await fetch(ROUTES_URL, {
        // 24h revalidate also lets Next's data cache help us across cold starts.
        next: { revalidate: 86_400 },
      });
      if (!res.ok) {
        throw new Error(`busrouter routes ${res.status}`);
      }
      const data = (await res.json()) as RoutesPayload;
      cache = { data, ts: Date.now() };
      return data;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

/**
 * Decode a Google-style encoded polyline (precision 5) into [lng, lat] pairs.
 * Inline implementation — avoids pulling in @googlemaps/polyline-codec.
 */
export function decodePolyline(encoded: string): Array<[number, number]> {
  const points: Array<[number, number]> = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  const len = encoded.length;

  while (index < len) {
    let result = 0;
    let shift = 0;
    let b: number;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    result = 0;
    shift = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push([lng / 1e5, lat / 1e5]);
  }
  return points;
}

function nearestPolylineIndex(
  poly: Array<[number, number]>,
  target: LatLng,
): { index: number; distanceKm: number } {
  let bestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const [plng, plat] = poly[i]!;
    const d = haversineDistanceKm(target, { lat: plat, lng: plng });
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  }
  return { index: bestIdx, distanceKm: bestDist };
}

const MAX_SNAP_KM = 0.25; // anything farther than 250m is probably a wrong-direction match.

/**
 * Get the polyline segment for a bus leg. Tries both directions and picks the
 * one whose snapped (from→to) order matches the leg's actual direction.
 *
 * Returns `null` when:
 *   - the service is missing from busrouter.sg's data
 *   - no nearby snap is found (e.g. demo topology stops)
 *
 * Callers should fall back to a straight line in that case.
 */
export async function getPolylineForLeg(
  serviceNo: string,
  fromCode: string,
  toCode: string,
): Promise<Array<[number, number]> | null> {
  let routes: RoutesPayload;
  try {
    routes = await loadAllRoutes();
  } catch {
    return null;
  }

  const dirs = routes[serviceNo];
  if (!dirs || dirs.length === 0) return null;

  const { index } = await loadTopology();
  const fromStop = index.stopsByCode.get(fromCode);
  const toStop = index.stopsByCode.get(toCode);
  if (!fromStop || !toStop) return null;

  let best: { sliced: Array<[number, number]>; score: number } | null = null;

  for (const encoded of dirs) {
    if (!encoded) continue;
    const decoded = decodePolyline(encoded);
    if (decoded.length < 2) continue;

    const fromHit = nearestPolylineIndex(decoded, fromStop.coords);
    const toHit = nearestPolylineIndex(decoded, toStop.coords);

    if (fromHit.distanceKm > MAX_SNAP_KM || toHit.distanceKm > MAX_SNAP_KM) continue;
    if (toHit.index <= fromHit.index) continue; // wrong direction.

    // Slice inclusive of both anchor points and prepend the actual stop coord
    // so the line visibly attaches to the pin.
    const segment = decoded.slice(fromHit.index, toHit.index + 1);
    const sliced: Array<[number, number]> = [
      [fromStop.coords.lng, fromStop.coords.lat],
      ...segment,
      [toStop.coords.lng, toStop.coords.lat],
    ];
    const score = fromHit.distanceKm + toHit.distanceKm;
    if (!best || score < best.score) best = { sliced, score };
  }

  return best ? best.sliced : null;
}
