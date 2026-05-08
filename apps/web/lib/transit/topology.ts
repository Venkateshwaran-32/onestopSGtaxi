import type { LatLng } from '@onestopsgtaxi/shared';
import { haversineDistanceKm } from '../geo';

export interface BusStopRow {
  code: string;
  name: string;
  road: string;
  coords: LatLng;
}

export interface BusRouteRow {
  serviceNo: string;
  direction: 1 | 2;
  stopSequence: number;
  busStopCode: string;
  distanceKm: number;
}

export interface BusServiceRow {
  serviceNo: string;
  operator: 'SBST' | 'SMRT' | 'TTS' | 'GAS' | string;
  loopDescription?: string;
  category?: string;
}

export interface TopologyData {
  generatedAt: string;
  stops: BusStopRow[];
  services: BusServiceRow[];
  routes: BusRouteRow[];
}

export interface TopologyIndex {
  stops: BusStopRow[];
  stopsByCode: Map<string, BusStopRow>;
  servicesByNo: Map<string, BusServiceRow>;
  routesByService: Map<string, BusRouteRow[]>;
  servicesByStop: Map<string, Set<string>>;
}

export function indexTopology(data: TopologyData): TopologyIndex {
  const stopsByCode = new Map<string, BusStopRow>();
  for (const s of data.stops) stopsByCode.set(s.code, s);

  const servicesByNo = new Map<string, BusServiceRow>();
  for (const sv of data.services) servicesByNo.set(sv.serviceNo, sv);

  const routesByService = new Map<string, BusRouteRow[]>();
  const servicesByStop = new Map<string, Set<string>>();
  for (const r of data.routes) {
    const key = `${r.serviceNo}-${r.direction}`;
    let arr = routesByService.get(key);
    if (!arr) {
      arr = [];
      routesByService.set(key, arr);
    }
    arr.push(r);
    let svcSet = servicesByStop.get(r.busStopCode);
    if (!svcSet) {
      svcSet = new Set();
      servicesByStop.set(r.busStopCode, svcSet);
    }
    svcSet.add(key);
  }

  for (const arr of routesByService.values()) {
    arr.sort((a, b) => a.stopSequence - b.stopSequence);
  }

  return { stops: data.stops, stopsByCode, servicesByNo, routesByService, servicesByStop };
}

export function nearestStops(
  index: TopologyIndex,
  coords: LatLng,
  maxDistanceKm = 0.4,
  topN = 4,
): Array<{ stop: BusStopRow; distanceKm: number }> {
  const ranked: Array<{ stop: BusStopRow; distanceKm: number }> = [];
  for (const s of index.stops) {
    const d = haversineDistanceKm(coords, s.coords);
    if (d <= maxDistanceKm) ranked.push({ stop: s, distanceKm: d });
  }
  ranked.sort((a, b) => a.distanceKm - b.distanceKm);
  return ranked.slice(0, topN);
}

export interface OrderedStopOnService {
  serviceKey: string;
  serviceNo: string;
  direction: 1 | 2;
  sequenceIndex: number;
  busStopCode: string;
  distanceKm: number;
}

export function stopsAfter(
  index: TopologyIndex,
  serviceKey: string,
  fromBusStopCode: string,
): OrderedStopOnService[] {
  const route = index.routesByService.get(serviceKey);
  if (!route) return [];
  const fromIdx = route.findIndex((r) => r.busStopCode === fromBusStopCode);
  if (fromIdx === -1) return [];
  const fromRow = route[fromIdx]!;
  return route
    .slice(fromIdx + 1)
    .map((r, i) => ({
      serviceKey,
      serviceNo: r.serviceNo,
      direction: r.direction,
      sequenceIndex: fromIdx + 1 + i,
      busStopCode: r.busStopCode,
      distanceKm: Math.max(0, r.distanceKm - fromRow.distanceKm),
    }));
}

export function rideMinutesBetween(distanceKm: number, mode: 'bus' | 'mrt' = 'bus'): number {
  const speedKmh = mode === 'mrt' ? 35 : 22;
  return Math.max(1, Math.round((distanceKm / speedKmh) * 60));
}
