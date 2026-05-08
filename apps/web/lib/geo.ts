import type { LatLng } from '@onestopsgtaxi/shared';

const EARTH_RADIUS_KM = 6371;

export function haversineDistanceKm(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const h =
    sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;

  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return EARTH_RADIUS_KM * c;
}

const SG_URBAN_AVG_SPEED_KMH = 28;
const ROAD_DETOUR_FACTOR = 1.35;

export function estimateDurationMinutes(distanceKm: number): number {
  const roadDistance = distanceKm * ROAD_DETOUR_FACTOR;
  const hours = roadDistance / SG_URBAN_AVG_SPEED_KMH;
  return Math.max(2, Math.round(hours * 60));
}
