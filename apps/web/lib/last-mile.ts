import type { LatLng, Place } from '@onestopsgtaxi/shared';
import { haversineDistanceKm } from './geo';
import { MRT_STATIONS, type MrtStation } from './mrt-stations';

const ROAD_DETOUR = 1.35;
const TAXI_BASE = 3.5;
const TAXI_PER_KM = 0.55;
const TAXI_PER_MIN = 0.2;
const SG_URBAN_AVG_SPEED_KMH = 28;

const WALK_THRESHOLD_KM = 0.6;
const WALK_SPEED_KMH = 4.8;
const MRT_BASE = 0.99;
const MRT_PER_KM = 0.1;
const MRT_FARE_CAP = 2.16;
const MRT_AVG_SPEED_KMH = 35;
const MRT_TRANSFER_PENALTY_MIN = 4;

const NEAR_RADIUS_KM = 3.2;
const TOP_NEAREST = 4;
const MIN_SAVINGS_SGD = 1.5;

export type LegMode = 'walk' | 'taxi' | 'mrt';

export interface Leg {
  mode: LegMode;
  fromLabel: string;
  toLabel: string;
  distanceKm: number;
  minutes: number;
  fareSGD: number;
}

export interface ComboOption {
  startStation: MrtStation;
  endStation: MrtStation;
  legs: [Leg, Leg, Leg];
  totalSGD: number;
  totalMinutes: number;
  savingsSGD: number;
}

interface Costs {
  taxiFare: number;
  taxiMinutes: number;
  walkMinutes: number;
}

function legDistanceKm(a: LatLng, b: LatLng): number {
  return haversineDistanceKm(a, b) * ROAD_DETOUR;
}

function taxiCost(distanceKm: number): Costs {
  const minutes = Math.max(2, Math.round((distanceKm / SG_URBAN_AVG_SPEED_KMH) * 60));
  const fare = TAXI_BASE + TAXI_PER_KM * distanceKm + TAXI_PER_MIN * minutes;
  return { taxiFare: Math.round(fare * 100) / 100, taxiMinutes: minutes, walkMinutes: 0 };
}

function walkCost(distanceKm: number): Costs {
  const minutes = Math.max(1, Math.round((distanceKm / WALK_SPEED_KMH) * 60));
  return { taxiFare: 0, taxiMinutes: 0, walkMinutes: minutes };
}

function buildLocalLeg(
  fromCoords: LatLng,
  fromLabel: string,
  toCoords: LatLng,
  toLabel: string,
): Leg {
  const haversine = haversineDistanceKm(fromCoords, toCoords);
  if (haversine <= WALK_THRESHOLD_KM) {
    const cost = walkCost(haversine);
    return {
      mode: 'walk',
      fromLabel,
      toLabel,
      distanceKm: Math.round(haversine * 100) / 100,
      minutes: cost.walkMinutes,
      fareSGD: 0,
    };
  }
  const distance = legDistanceKm(fromCoords, toCoords);
  const cost = taxiCost(distance);
  return {
    mode: 'taxi',
    fromLabel,
    toLabel,
    distanceKm: Math.round(distance * 100) / 100,
    minutes: cost.taxiMinutes,
    fareSGD: cost.taxiFare,
  };
}

function mrtLeg(start: MrtStation, end: MrtStation): Leg {
  const distance = haversineDistanceKm(start.coords, end.coords);
  const sharedLine = start.lines.some((l) => end.lines.includes(l));
  const transferPenalty = sharedLine ? 0 : MRT_TRANSFER_PENALTY_MIN;
  const minutes = Math.max(
    2,
    Math.round((distance / MRT_AVG_SPEED_KMH) * 60 + transferPenalty),
  );
  const rawFare = MRT_BASE + MRT_PER_KM * distance;
  const fareSGD = Math.min(MRT_FARE_CAP, Math.round(rawFare * 100) / 100);
  return {
    mode: 'mrt',
    fromLabel: start.name,
    toLabel: end.name,
    distanceKm: Math.round(distance * 100) / 100,
    minutes,
    fareSGD,
  };
}

function nearestStations(coords: LatLng): MrtStation[] {
  return MRT_STATIONS.map((s) => ({
    s,
    d: haversineDistanceKm(coords, s.coords),
  }))
    .filter(({ d }) => d <= NEAR_RADIUS_KM)
    .sort((a, b) => a.d - b.d)
    .slice(0, TOP_NEAREST)
    .map(({ s }) => s);
}

function directTaxi(pickup: Place, dropoff: Place): { fareSGD: number; minutes: number } {
  const distance = legDistanceKm(pickup.coords, dropoff.coords);
  const cost = taxiCost(distance);
  return { fareSGD: cost.taxiFare, minutes: cost.taxiMinutes };
}

export function computeCombos(pickup: Place, dropoff: Place): {
  direct: { fareSGD: number; minutes: number };
  combos: ComboOption[];
} {
  const direct = directTaxi(pickup, dropoff);
  const startCandidates = nearestStations(pickup.coords);
  const endCandidates = nearestStations(dropoff.coords);

  const combos: ComboOption[] = [];

  for (const start of startCandidates) {
    for (const end of endCandidates) {
      if (start.id === end.id) continue;
      const stationDistance = haversineDistanceKm(start.coords, end.coords);
      if (stationDistance < 2) continue;

      const leg1 = buildLocalLeg(pickup.coords, pickup.label, start.coords, start.name);
      const leg2 = mrtLeg(start, end);
      const leg3 = buildLocalLeg(end.coords, end.name, dropoff.coords, dropoff.label);

      const totalSGD = Math.round((leg1.fareSGD + leg2.fareSGD + leg3.fareSGD) * 100) / 100;
      const totalMinutes = leg1.minutes + leg2.minutes + leg3.minutes + 4;
      const savings = Math.round((direct.fareSGD - totalSGD) * 100) / 100;

      if (savings >= MIN_SAVINGS_SGD) {
        combos.push({
          startStation: start,
          endStation: end,
          legs: [leg1, leg2, leg3],
          totalSGD,
          totalMinutes,
          savingsSGD: savings,
        });
      }
    }
  }

  combos.sort((a, b) => a.totalSGD - b.totalSGD);
  return { direct, combos: combos.slice(0, 5) };
}
