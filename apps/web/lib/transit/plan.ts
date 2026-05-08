import type { LatLng } from '@onestopsgtaxi/shared';
import { haversineDistanceKm } from '../geo';
import { MRT_STATIONS, type MrtStation } from '../mrt-stations';
import {
  nearestStops,
  rideMinutesBetween,
  stopsAfter,
  type BusStopRow,
  type TopologyIndex,
} from './topology';
import {
  nextSlotAfter,
  type ArrivalLookup,
  type ArrivalSlot,
} from './lta';

const MRT_HEADWAY_PEAK_MIN = 3;
const MRT_HEADWAY_OFFPEAK_MIN = 6;
const MRT_AVG_SPEED_KMH = 35;
const WALK_SPEED_KMH = 4.8;
const WALK_THRESHOLD_KM = 0.4;

export type LegMode = 'bus' | 'mrt' | 'walk';

export interface TransitLeg {
  mode: LegMode;
  fromName: string;
  toName: string;
  fromCode?: string;
  toCode?: string;
  fromCoords?: LatLng;
  toCoords?: LatLng;
  serviceNo?: string;
  waitMinutes: number;
  rideMinutes: number;
  loadHint?: string;
  liveData: boolean;
}

export interface TransitItinerary {
  id: string;
  totalMinutes: number;
  totalWaitMinutes: number;
  totalRideMinutes: number;
  legs: TransitLeg[];
  rationale: string;
}

interface PlanInput {
  topology: TopologyIndex;
  arrivals: Map<string, ArrivalLookup>;
  origin: { coords?: LatLng; busStopCode?: string };
  dest: { coords?: LatLng; busStopCode?: string };
  now?: Date;
}

function isPeakHour(now: Date): boolean {
  const day = now.getDay();
  if (day === 0 || day === 6) return false;
  const h = now.getHours();
  return (h >= 7 && h < 10) || (h >= 17 && h < 20);
}

function originStopOptions(
  topology: TopologyIndex,
  o: PlanInput['origin'],
): BusStopRow[] {
  if (o.busStopCode) {
    const s = topology.stopsByCode.get(o.busStopCode);
    return s ? [s] : [];
  }
  if (!o.coords) return [];
  return nearestStops(topology, o.coords).map((r) => r.stop);
}

function destStopOptions(
  topology: TopologyIndex,
  d: PlanInput['dest'],
): BusStopRow[] {
  if (d.busStopCode) {
    const s = topology.stopsByCode.get(d.busStopCode);
    return s ? [s] : [];
  }
  if (!d.coords) return [];
  return nearestStops(topology, d.coords).map((r) => r.stop);
}

function busLeg(
  fromStop: BusStopRow,
  toStop: BusStopRow,
  serviceNo: string,
  waitMinutes: number,
  distanceKm: number,
  arrival: ArrivalSlot | null,
  liveData: boolean,
): TransitLeg {
  const rideMinutes = rideMinutesBetween(distanceKm, 'bus');
  return {
    mode: 'bus',
    fromName: fromStop.name,
    toName: toStop.name,
    fromCode: fromStop.code,
    toCode: toStop.code,
    fromCoords: fromStop.coords,
    toCoords: toStop.coords,
    serviceNo,
    waitMinutes,
    rideMinutes,
    loadHint: arrival?.load && arrival.load !== 'unknown' ? arrival.load : undefined,
    liveData,
  };
}

function walkLeg(from: BusStopRow | MrtStation, to: BusStopRow | MrtStation): TransitLeg {
  const fromCoords = 'coords' in from ? from.coords : (from as BusStopRow).coords;
  const toCoords = 'coords' in to ? to.coords : (to as BusStopRow).coords;
  const distanceKm = haversineDistanceKm(fromCoords, toCoords);
  const rideMinutes = Math.max(1, Math.round((distanceKm / WALK_SPEED_KMH) * 60));
  return {
    mode: 'walk',
    fromName: 'name' in from ? from.name : 'origin',
    toName: 'name' in to ? to.name : 'destination',
    fromCoords,
    toCoords,
    waitMinutes: 0,
    rideMinutes,
    liveData: false,
  };
}

function mrtLeg(from: MrtStation, to: MrtStation, now: Date): TransitLeg {
  const distanceKm = haversineDistanceKm(from.coords, to.coords);
  const rideMinutes = Math.max(2, Math.round((distanceKm / MRT_AVG_SPEED_KMH) * 60));
  const sharedLine = from.lines.some((l) => to.lines.includes(l));
  const transferPenalty = sharedLine ? 0 : 4;
  const headway = isPeakHour(now) ? MRT_HEADWAY_PEAK_MIN : MRT_HEADWAY_OFFPEAK_MIN;
  return {
    mode: 'mrt',
    fromName: from.name,
    toName: to.name,
    waitMinutes: Math.round(headway / 2),
    rideMinutes: rideMinutes + transferPenalty,
    fromCoords: from.coords,
    toCoords: to.coords,
    liveData: false,
  };
}

function findNearestMrt(coords: LatLng, maxKm: number): MrtStation | null {
  let best: { s: MrtStation; d: number } | null = null;
  for (const s of MRT_STATIONS) {
    const d = haversineDistanceKm(coords, s.coords);
    if (d <= maxKm && (!best || d < best.d)) best = { s, d };
  }
  return best ? best.s : null;
}

function buildDirectCandidates(input: PlanInput, originStops: BusStopRow[], destStops: BusStopRow[]): TransitItinerary[] {
  const out: TransitItinerary[] = [];
  const live = input.arrivals.size > 0;

  for (const oStop of originStops) {
    const oServices = input.topology.servicesByStop.get(oStop.code);
    if (!oServices) continue;
    for (const serviceKey of oServices) {
      const onwards = stopsAfter(input.topology, serviceKey, oStop.code);
      for (const onward of onwards) {
        const dStop = destStops.find((d) => d.code === onward.busStopCode);
        if (!dStop) continue;
        const arrivalsAtO = input.arrivals.get(oStop.code);
        const slot = arrivalsAtO?.services[onward.serviceNo];
        const wait = slot ? (slot.arrivals[0]?.etaMinutes ?? 6) : 6;
        const liveData = !!arrivalsAtO?.services[onward.serviceNo]?.arrivals[0]?.estimatedArrivalAt;

        const leg = busLeg(
          oStop,
          dStop,
          onward.serviceNo,
          wait,
          onward.distanceKm,
          slot?.arrivals[0] ?? null,
          liveData,
        );
        out.push({
          id: `direct-${onward.serviceNo}-${oStop.code}-${dStop.code}`,
          totalMinutes: leg.waitMinutes + leg.rideMinutes,
          totalWaitMinutes: leg.waitMinutes,
          totalRideMinutes: leg.rideMinutes,
          legs: [leg],
          rationale: `Direct on ${onward.serviceNo}.${live ? ' Live wait time.' : ' Headway-based estimate.'}`,
        });
      }
    }
  }

  return out;
}

function buildOneTransferCandidates(
  input: PlanInput,
  originStops: BusStopRow[],
  destStops: BusStopRow[],
): TransitItinerary[] {
  const out: TransitItinerary[] = [];
  const destCodes = new Set(destStops.map((d) => d.code));

  for (const oStop of originStops) {
    const oServices = input.topology.servicesByStop.get(oStop.code);
    if (!oServices) continue;

    for (const sKey1 of oServices) {
      const onwardsFromO = stopsAfter(input.topology, sKey1, oStop.code);
      for (const xCandidate of onwardsFromO) {
        if (destCodes.has(xCandidate.busStopCode)) continue;
        const xStop = input.topology.stopsByCode.get(xCandidate.busStopCode);
        if (!xStop) continue;

        const xServices = input.topology.servicesByStop.get(xStop.code);
        if (!xServices) continue;

        for (const sKey2 of xServices) {
          if (sKey2 === sKey1) continue;
          const onwardsFromX = stopsAfter(input.topology, sKey2, xStop.code);
          for (const dCandidate of onwardsFromX) {
            if (!destCodes.has(dCandidate.busStopCode)) continue;
            const dStop = input.topology.stopsByCode.get(dCandidate.busStopCode);
            if (!dStop) continue;

            const arrAtO = input.arrivals.get(oStop.code);
            const slot1 = arrAtO?.services[xCandidate.serviceNo];
            const wait1 = slot1 ? (slot1.arrivals[0]?.etaMinutes ?? 6) : 6;
            const live1 = !!slot1?.arrivals[0]?.estimatedArrivalAt;
            const leg1 = busLeg(
              oStop,
              xStop,
              xCandidate.serviceNo,
              wait1,
              xCandidate.distanceKm,
              slot1?.arrivals[0] ?? null,
              live1,
            );

            const arriveAtX = wait1 + leg1.rideMinutes;
            const arrAtX = input.arrivals.get(xStop.code);
            const slot2Service = arrAtX?.services[dCandidate.serviceNo];
            const matchedSlot = nextSlotAfter(slot2Service, arriveAtX);
            const wait2 = matchedSlot?.etaMinutes != null
              ? Math.max(0, matchedSlot.etaMinutes - arriveAtX)
              : 6;
            const live2 = !!matchedSlot?.estimatedArrivalAt;
            const leg2 = busLeg(
              xStop,
              dStop,
              dCandidate.serviceNo,
              wait2,
              dCandidate.distanceKm,
              matchedSlot,
              live2,
            );

            const total = leg1.waitMinutes + leg1.rideMinutes + leg2.waitMinutes + leg2.rideMinutes;
            const liveCount = (live1 ? 1 : 0) + (live2 ? 1 : 0);
            out.push({
              id: `xfer-${xCandidate.serviceNo}-${dCandidate.serviceNo}-${oStop.code}-${xStop.code}-${dStop.code}`,
              totalMinutes: total,
              totalWaitMinutes: leg1.waitMinutes + leg2.waitMinutes,
              totalRideMinutes: leg1.rideMinutes + leg2.rideMinutes,
              legs: [leg1, leg2],
              rationale: `${xCandidate.serviceNo} → transfer at ${xStop.name} → ${dCandidate.serviceNo}. ${liveCount}/2 legs use live arrivals.`,
            });
          }
        }
      }
    }
  }

  return out;
}

function buildMrtCandidates(input: PlanInput, now: Date): TransitItinerary[] {
  const out: TransitItinerary[] = [];
  if (!input.origin.coords || !input.dest.coords) return out;

  const originMrt = findNearestMrt(input.origin.coords, 0.9);
  const destMrt = findNearestMrt(input.dest.coords, 0.9);
  if (!originMrt || !destMrt) return out;
  if (originMrt.id === destMrt.id) return out;

  const walk1 = walkLeg(
    {
      code: '',
      name: 'You',
      road: '',
      coords: input.origin.coords,
    },
    originMrt,
  );
  const ride = mrtLeg(originMrt, destMrt, now);
  const walk2 = walkLeg(
    destMrt,
    {
      code: '',
      name: 'Destination',
      road: '',
      coords: input.dest.coords,
    },
  );

  const total =
    walk1.rideMinutes + ride.waitMinutes + ride.rideMinutes + walk2.rideMinutes;

  out.push({
    id: `mrt-${originMrt.id}-${destMrt.id}`,
    totalMinutes: total,
    totalWaitMinutes: ride.waitMinutes,
    totalRideMinutes: walk1.rideMinutes + ride.rideMinutes + walk2.rideMinutes,
    legs: [walk1, ride, walk2],
    rationale: `Walk to ${originMrt.name}, ride MRT to ${destMrt.name}, walk to destination.`,
  });

  return out;
}

export function planTransit(input: PlanInput): TransitItinerary[] {
  const now = input.now ?? new Date();
  const originStops = originStopOptions(input.topology, input.origin);
  const destStops = destStopOptions(input.topology, input.dest);

  if (originStops.length === 0 || destStops.length === 0) {
    return buildMrtCandidates(input, now);
  }

  const direct = buildDirectCandidates(input, originStops, destStops);
  const transfers = buildOneTransferCandidates(input, originStops, destStops);
  const mrt = buildMrtCandidates(input, now);

  const all = [...direct, ...transfers, ...mrt];

  const dedup = new Map<string, TransitItinerary>();
  for (const it of all) {
    const sig = it.legs
      .map((l) =>
        l.mode === 'bus'
          ? `b${l.serviceNo}:${l.fromCode}>${l.toCode}`
          : l.mode === 'mrt'
            ? `m:${l.fromName}>${l.toName}`
            : `w:${l.fromName}>${l.toName}`,
      )
      .join('|');
    const existing = dedup.get(sig);
    if (!existing || it.totalMinutes < existing.totalMinutes) dedup.set(sig, it);
  }

  return Array.from(dedup.values())
    .sort((a, b) => a.totalMinutes - b.totalMinutes)
    .slice(0, 6);
}

export function uniqueStopCodesFromCandidates(items: TransitItinerary[]): string[] {
  const codes = new Set<string>();
  for (const it of items) {
    for (const l of it.legs) {
      if (l.fromCode) codes.add(l.fromCode);
      if (l.toCode) codes.add(l.toCode);
    }
  }
  return Array.from(codes);
}
