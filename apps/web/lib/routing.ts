import type { LatLng } from '@onestopsgtaxi/shared';
import { estimateDurationMinutes, haversineDistanceKm } from './geo';

export interface RouteResult {
  distanceKm: number;
  durationMinutes: number;
  source: 'mapbox' | 'osrm' | 'fallback';
  geometry?: {
    type: 'LineString';
    coordinates: [number, number][];
  };
}

const OSRM_BASE =
  process.env.OSRM_BASE_URL || 'https://router.project-osrm.org';

function haversineFallback(pickup: LatLng, dropoff: LatLng): RouteResult {
  const straightKm = haversineDistanceKm(pickup, dropoff);
  return {
    distanceKm: Math.round(straightKm * 1.35 * 100) / 100,
    durationMinutes: estimateDurationMinutes(straightKm),
    source: 'fallback',
  };
}

async function tryMapbox(
  pickup: LatLng,
  dropoff: LatLng,
  token: string,
): Promise<RouteResult | null> {
  const url = new URL(
    `https://api.mapbox.com/directions/v5/mapbox/driving/${pickup.lng},${pickup.lat};${dropoff.lng},${dropoff.lat}`,
  );
  url.searchParams.set('access_token', token);
  url.searchParams.set('overview', 'simplified');
  url.searchParams.set('geometries', 'geojson');

  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) {
    console.warn('[routing] Mapbox returned', res.status);
    return null;
  }
  const data = (await res.json()) as {
    routes?: Array<{
      distance: number;
      duration: number;
      geometry?: { type: 'LineString'; coordinates: [number, number][] };
    }>;
  };
  const route = data.routes?.[0];
  if (!route) return null;

  return {
    distanceKm: Math.round((route.distance / 1000) * 100) / 100,
    durationMinutes: Math.max(2, Math.round(route.duration / 60)),
    source: 'mapbox',
    geometry: route.geometry,
  };
}

async function tryOsrm(pickup: LatLng, dropoff: LatLng): Promise<RouteResult | null> {
  const url = `${OSRM_BASE}/route/v1/driving/${pickup.lng},${pickup.lat};${dropoff.lng},${dropoff.lat}?overview=simplified&geometries=geojson`;

  const res = await fetch(url, {
    next: { revalidate: 60 },
    signal: AbortSignal.timeout(4000),
  });
  if (!res.ok) {
    console.warn('[routing] OSRM returned', res.status);
    return null;
  }
  const data = (await res.json()) as {
    code?: string;
    routes?: Array<{
      distance: number;
      duration: number;
      geometry?: { type: 'LineString'; coordinates: [number, number][] };
    }>;
  };
  if (data.code !== 'Ok') return null;
  const route = data.routes?.[0];
  if (!route) return null;

  return {
    distanceKm: Math.round((route.distance / 1000) * 100) / 100,
    durationMinutes: Math.max(2, Math.round(route.duration / 60)),
    source: 'osrm',
    geometry: route.geometry,
  };
}

/**
 * Routing tier list:
 *   1. Mapbox if MAPBOX_ACCESS_TOKEN set (best)
 *   2. OSRM (project-osrm.org public demo or self-hosted) — free, no key
 *   3. Haversine + 1.35x road factor — last resort
 */
export async function getRoute(pickup: LatLng, dropoff: LatLng): Promise<RouteResult> {
  const token = process.env.MAPBOX_ACCESS_TOKEN;

  if (token) {
    try {
      const result = await tryMapbox(pickup, dropoff, token);
      if (result) return result;
    } catch (err) {
      console.warn('[routing] Mapbox threw:', err);
    }
  }

  try {
    const result = await tryOsrm(pickup, dropoff);
    if (result) return result;
  } catch (err) {
    console.warn('[routing] OSRM threw:', err);
  }

  return haversineFallback(pickup, dropoff);
}
