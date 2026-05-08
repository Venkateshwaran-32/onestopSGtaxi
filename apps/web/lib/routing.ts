import type { LatLng } from '@onestopsgtaxi/shared';
import { estimateDurationMinutes, haversineDistanceKm } from './geo';

export interface RouteResult {
  distanceKm: number;
  durationMinutes: number;
  source: 'mapbox' | 'fallback';
}

export async function getRoute(pickup: LatLng, dropoff: LatLng): Promise<RouteResult> {
  const token = process.env.MAPBOX_ACCESS_TOKEN;

  if (!token) {
    const distanceKm = haversineDistanceKm(pickup, dropoff) * 1.35;
    return {
      distanceKm: Math.round(distanceKm * 100) / 100,
      durationMinutes: estimateDurationMinutes(haversineDistanceKm(pickup, dropoff)),
      source: 'fallback',
    };
  }

  try {
    const url = new URL(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${pickup.lng},${pickup.lat};${dropoff.lng},${dropoff.lat}`,
    );
    url.searchParams.set('access_token', token);
    url.searchParams.set('overview', 'false');
    url.searchParams.set('geometries', 'polyline');

    const res = await fetch(url, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      throw new Error(`Mapbox returned ${res.status}`);
    }

    const data = (await res.json()) as {
      routes?: Array<{ distance: number; duration: number }>;
    };
    const route = data.routes?.[0];
    if (!route) {
      throw new Error('Mapbox returned no routes');
    }

    return {
      distanceKm: Math.round((route.distance / 1000) * 100) / 100,
      durationMinutes: Math.max(2, Math.round(route.duration / 60)),
      source: 'mapbox',
    };
  } catch (err) {
    console.warn('[routing] Mapbox failed, falling back to haversine:', err);
    const distanceKm = haversineDistanceKm(pickup, dropoff) * 1.35;
    return {
      distanceKm: Math.round(distanceKm * 100) / 100,
      durationMinutes: estimateDurationMinutes(haversineDistanceKm(pickup, dropoff)),
      source: 'fallback',
    };
  }
}
