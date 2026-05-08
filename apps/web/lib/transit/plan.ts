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
const TRANSFER_WALK_THRESHOLD_KM = 0.4;

// V2 search bounds — keep tight to stay well under 1s.
const MAX_X1_PER_ORIGIN = 8;
const MAX_X1_DISTANCE_FACTOR = 1.5; // X1 must not be more than this × direct OD distance away.
const MAX_TOP_PER_X1 = 4; // Cap on candidates kept per X1 (per spec).
const MAX_DEST_BACKWARD_NODES = 60;
const MAX_RESULTS = 8;

export type LegMode = 'bus' | 'mrt' | 'walk';
export type ConfidenceLevel = 'high' | 'medium' | 'low';

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
  /**
   * V2: Reliability score in 0–100 range. Computed for bus legs primarily;
   * walk/mrt legs receive heuristic scores too.
   */
  reliabilityScore?: number;
  /**
   * Optional [lng, lat] polyline tracing the actual road geometry between
   * the leg's from/to stops. Populated for bus legs server-side after
   * planning; absent on walk/mrt legs.
   */
  polyline?: Array<[number, number]>;
}

export interface TransitItinerary {
  id: string;
  totalMinutes: number;
  totalWaitMinutes: number;
  totalRideMinutes: number;
  legs: TransitLeg[];
  rationale: string;
  /**
   * V2: itinerary-level confidence derived from min leg reliability.
   */
  confidence?: ConfidenceLevel;
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

function transferWalkLeg(from: BusStopRow, to: BusStopRow): TransitLeg {
  const distanceKm = haversineDistanceKm(from.coords, to.coords);
  const rideMinutes = Math.max(1, Math.round((distanceKm / WALK_SPEED_KMH) * 60));
  return {
    mode: 'walk',
    fromName: from.name,
    toName: to.name,
    fromCode: from.code,
    toCode: to.code,
    fromCoords: from.coords,
    toCoords: to.coords,
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

/**
 * Find bus stops within the walking-transfer threshold of a given stop.
 * Excludes the stop itself.
 */
function nearbyStopsForTransfer(
  topology: TopologyIndex,
  stop: BusStopRow,
  thresholdKm: number = TRANSFER_WALK_THRESHOLD_KM,
  maxN = 6,
): Array<{ stop: BusStopRow; distanceKm: number }> {
  const out: Array<{ stop: BusStopRow; distanceKm: number }> = [];
  for (const s of topology.stops) {
    if (s.code === stop.code) continue;
    const d = haversineDistanceKm(stop.coords, s.coords);
    if (d > 0 && d <= thresholdKm) out.push({ stop: s, distanceKm: d });
  }
  out.sort((a, b) => a.distanceKm - b.distanceKm);
  return out.slice(0, maxN);
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

/**
 * Build 1-transfer candidates that may include a short walk between the alighting
 * stop and the boarding stop of the second service. Only emitted when no
 * same-stop transfer already covers the same service pair.
 */
function buildOneTransferWithWalkCandidates(
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
      // Take a bounded slice — closest X1 candidates first by distance.
      const x1Candidates = onwardsFromO
        .filter((c) => !destCodes.has(c.busStopCode))
        .slice(0, MAX_X1_PER_ORIGIN);

      for (const x1 of x1Candidates) {
        const xStop = input.topology.stopsByCode.get(x1.busStopCode);
        if (!xStop) continue;
        const nearby = nearbyStopsForTransfer(input.topology, xStop);
        if (nearby.length === 0) continue;

        let perX1Emitted = 0;

        for (const { stop: xPrime, distanceKm: walkKm } of nearby) {
          if (perX1Emitted >= MAX_TOP_PER_X1) break;
          const x2Services = input.topology.servicesByStop.get(xPrime.code);
          if (!x2Services) continue;

          for (const sKey2 of x2Services) {
            if (sKey2 === sKey1) continue;
            const onwardsFromXPrime = stopsAfter(input.topology, sKey2, xPrime.code);
            for (const dCandidate of onwardsFromXPrime) {
              if (!destCodes.has(dCandidate.busStopCode)) continue;
              const dStop = input.topology.stopsByCode.get(dCandidate.busStopCode);
              if (!dStop) continue;

              // Build legs.
              const arrAtO = input.arrivals.get(oStop.code);
              const slot1 = arrAtO?.services[x1.serviceNo];
              const wait1 = slot1 ? (slot1.arrivals[0]?.etaMinutes ?? 6) : 6;
              const live1 = !!slot1?.arrivals[0]?.estimatedArrivalAt;
              const leg1 = busLeg(
                oStop,
                xStop,
                x1.serviceNo,
                wait1,
                x1.distanceKm,
                slot1?.arrivals[0] ?? null,
                live1,
              );

              const walk = transferWalkLeg(xStop, xPrime);
              walk.rideMinutes = Math.max(1, Math.round((walkKm / WALK_SPEED_KMH) * 60));

              const arriveAtXPrime = wait1 + leg1.rideMinutes + walk.rideMinutes;
              const arrAtXPrime = input.arrivals.get(xPrime.code);
              const slot2Service = arrAtXPrime?.services[dCandidate.serviceNo];
              const matchedSlot = nextSlotAfter(slot2Service, arriveAtXPrime);
              const wait2 = matchedSlot?.etaMinutes != null
                ? Math.max(0, matchedSlot.etaMinutes - arriveAtXPrime)
                : 6;
              const live2 = !!matchedSlot?.estimatedArrivalAt;
              const leg2 = busLeg(
                xPrime,
                dStop,
                dCandidate.serviceNo,
                wait2,
                dCandidate.distanceKm,
                matchedSlot,
                live2,
              );

              const total =
                leg1.waitMinutes +
                leg1.rideMinutes +
                walk.rideMinutes +
                leg2.waitMinutes +
                leg2.rideMinutes;
              const liveCount = (live1 ? 1 : 0) + (live2 ? 1 : 0);

              out.push({
                id: `xfer-walk-${x1.serviceNo}-${dCandidate.serviceNo}-${oStop.code}-${xStop.code}-${xPrime.code}-${dStop.code}`,
                totalMinutes: total,
                totalWaitMinutes: leg1.waitMinutes + leg2.waitMinutes,
                totalRideMinutes: leg1.rideMinutes + walk.rideMinutes + leg2.rideMinutes,
                legs: [leg1, walk, leg2],
                rationale: `${x1.serviceNo} → walk ${Math.round(walkKm * 1000)} m to ${xPrime.name} → ${dCandidate.serviceNo}. ${liveCount}/2 bus legs use live arrivals.`,
              });
              perX1Emitted++;
              if (perX1Emitted >= MAX_TOP_PER_X1) break;
            }
            if (perX1Emitted >= MAX_TOP_PER_X1) break;
          }
        }
      }
    }
  }

  return out;
}

/**
 * Build 2-transfer candidates via bidirectional candidate generation.
 *
 * Forward: from each origin O, for each service to X1, for each service from X1
 * collect reachable X2 nodes (with rolling distance/wait estimates).
 * Backward: from each dest D, for each service that reaches D, collect predecessor
 * stops Y. Match X2 == Y to stitch a 3-leg itinerary.
 *
 * Pruning:
 * - Skip X1 already a 1-transfer dest (handled by buildOneTransferCandidates).
 * - Cap MAX_TOP_PER_X1 candidates per X1.
 * - Reject if total leg distance > 2x direct OD distance.
 */
function buildTwoTransferCandidates(
  input: PlanInput,
  originStops: BusStopRow[],
  destStops: BusStopRow[],
): TransitItinerary[] {
  const out: TransitItinerary[] = [];
  const destCodes = new Set(destStops.map((d) => d.code));

  // Build backward index: stop code Y -> list of (serviceKey, lastStopRow, dStop, distanceKm to dest)
  interface BackwardEntry {
    serviceKey: string;
    serviceNo: string;
    yStop: BusStopRow;
    dStop: BusStopRow;
    legDistanceKm: number;
  }
  const backwardByY = new Map<string, BackwardEntry[]>();
  let backwardCount = 0;
  outerD: for (const dStop of destStops) {
    for (const [serviceKey, route] of input.topology.routesByService) {
      if (backwardCount > 5000) break outerD;
      const dIdx = route.findIndex((r) => r.busStopCode === dStop.code);
      if (dIdx <= 0) continue;
      const dRow = route[dIdx]!;
      // Walk backwards through the route — every preceding stop is a possible Y.
      for (let i = dIdx - 1; i >= 0; i--) {
        const yRow = route[i]!;
        const distanceKm = Math.max(0, dRow.distanceKm - yRow.distanceKm);
        const yStop = input.topology.stopsByCode.get(yRow.busStopCode);
        if (!yStop) continue;
        let arr = backwardByY.get(yRow.busStopCode);
        if (!arr) {
          arr = [];
          backwardByY.set(yRow.busStopCode, arr);
        }
        if (arr.length >= MAX_DEST_BACKWARD_NODES) continue;
        arr.push({
          serviceKey,
          serviceNo: yRow.serviceNo,
          yStop,
          dStop,
          legDistanceKm: distanceKm,
        });
        backwardCount++;
      }
    }
  }

  if (backwardByY.size === 0) return out;

  // Direct OD haversine for 2x-distance pruning.
  let directOdKm = Infinity;
  for (const o of originStops) {
    for (const d of destStops) {
      const dist = haversineDistanceKm(o.coords, d.coords);
      if (dist < directOdKm) directOdKm = dist;
    }
  }
  const maxLegDistance = Number.isFinite(directOdKm) ? directOdKm * 2 : Infinity;

  // Forward exploration with pruning.
  for (const oStop of originStops) {
    const oServices = input.topology.servicesByStop.get(oStop.code);
    if (!oServices) continue;

    for (const sKey1 of oServices) {
      const onwardsFromO = stopsAfter(input.topology, sKey1, oStop.code);
      // Only consider X1 stops within MAX_X1_DISTANCE_FACTOR × direct distance.
      const x1Candidates = onwardsFromO
        .filter((c) => {
          // Skip if X1 is the destination — that's a direct trip.
          if (destCodes.has(c.busStopCode)) return false;
          // Distance prune: don't go too far afield for a transfer point.
          if (c.distanceKm > directOdKm * MAX_X1_DISTANCE_FACTOR) return false;
          return true;
        })
        .slice(0, MAX_X1_PER_ORIGIN);

      for (const x1 of x1Candidates) {
        const x1Stop = input.topology.stopsByCode.get(x1.busStopCode);
        if (!x1Stop) continue;
        const x1Services = input.topology.servicesByStop.get(x1.busStopCode);
        if (!x1Services) continue;

        // Per-X1 emission cap.
        let perX1Emitted = 0;
        const seenMatches = new Set<string>();

        for (const sKey2 of x1Services) {
          if (perX1Emitted >= MAX_TOP_PER_X1) break;
          if (sKey2 === sKey1) continue;
          const onwardsFromX1 = stopsAfter(input.topology, sKey2, x1.busStopCode);

          for (const x2 of onwardsFromX1) {
            if (perX1Emitted >= MAX_TOP_PER_X1) break;
            if (destCodes.has(x2.busStopCode)) continue; // would be 1-transfer
            if (x2.busStopCode === oStop.code) continue;
            const matches = backwardByY.get(x2.busStopCode);
            if (!matches || matches.length === 0) continue;
            const x2Stop = input.topology.stopsByCode.get(x2.busStopCode);
            if (!x2Stop) continue;

            for (const m of matches) {
              if (perX1Emitted >= MAX_TOP_PER_X1) break;
              if (m.serviceKey === sKey2 || m.serviceKey === sKey1) continue;
              // Total distance prune.
              const totalDist = x1.distanceKm + x2.distanceKm + m.legDistanceKm;
              if (totalDist > maxLegDistance) continue;
              const sig = `${x1.serviceNo}|${x2.serviceNo}|${m.serviceNo}|${oStop.code}|${x1.busStopCode}|${x2.busStopCode}|${m.dStop.code}`;
              if (seenMatches.has(sig)) continue;
              seenMatches.add(sig);

              // Build legs with chained timing.
              const arrAtO = input.arrivals.get(oStop.code);
              const slot1 = arrAtO?.services[x1.serviceNo];
              const wait1 = slot1 ? (slot1.arrivals[0]?.etaMinutes ?? 6) : 6;
              const live1 = !!slot1?.arrivals[0]?.estimatedArrivalAt;
              const leg1 = busLeg(
                oStop,
                x1Stop,
                x1.serviceNo,
                wait1,
                x1.distanceKm,
                slot1?.arrivals[0] ?? null,
                live1,
              );

              const arriveAtX1 = wait1 + leg1.rideMinutes;
              const arrAtX1 = input.arrivals.get(x1Stop.code);
              const slot2Service = arrAtX1?.services[x2.serviceNo];
              const matched2 = nextSlotAfter(slot2Service, arriveAtX1);
              const wait2 = matched2?.etaMinutes != null
                ? Math.max(0, matched2.etaMinutes - arriveAtX1)
                : 6;
              const live2 = !!matched2?.estimatedArrivalAt;
              const leg2 = busLeg(
                x1Stop,
                x2Stop,
                x2.serviceNo,
                wait2,
                x2.distanceKm,
                matched2,
                live2,
              );

              const arriveAtX2 = arriveAtX1 + leg2.waitMinutes + leg2.rideMinutes;
              const arrAtX2 = input.arrivals.get(x2Stop.code);
              const slot3Service = arrAtX2?.services[m.serviceNo];
              const matched3 = nextSlotAfter(slot3Service, arriveAtX2);
              const wait3 = matched3?.etaMinutes != null
                ? Math.max(0, matched3.etaMinutes - arriveAtX2)
                : 6;
              const live3 = !!matched3?.estimatedArrivalAt;
              const leg3 = busLeg(
                x2Stop,
                m.dStop,
                m.serviceNo,
                wait3,
                m.legDistanceKm,
                matched3,
                live3,
              );

              const total =
                leg1.waitMinutes +
                leg1.rideMinutes +
                leg2.waitMinutes +
                leg2.rideMinutes +
                leg3.waitMinutes +
                leg3.rideMinutes;
              const liveCount =
                (live1 ? 1 : 0) + (live2 ? 1 : 0) + (live3 ? 1 : 0);

              out.push({
                id: `xfer2-${x1.serviceNo}-${x2.serviceNo}-${m.serviceNo}-${oStop.code}-${x1Stop.code}-${x2Stop.code}-${m.dStop.code}`,
                totalMinutes: total,
                totalWaitMinutes: leg1.waitMinutes + leg2.waitMinutes + leg3.waitMinutes,
                totalRideMinutes: leg1.rideMinutes + leg2.rideMinutes + leg3.rideMinutes,
                legs: [leg1, leg2, leg3],
                rationale: `${x1.serviceNo} → ${x2.serviceNo} → ${m.serviceNo}. Two transfers (${x1Stop.name}, ${x2Stop.name}). ${liveCount}/3 legs live.`,
              });
              perX1Emitted++;
            }
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

// ─────────────────────────────────────────────────────────────────────────────
// V2 reliability scoring
// ─────────────────────────────────────────────────────────────────────────────

function waitScore(waitMinutes: number): number {
  if (waitMinutes <= 2) return 100;
  if (waitMinutes <= 6) return 80;
  if (waitMinutes <= 10) return 60;
  return 40;
}

function transferSlackBonus(waitMinutesAtTransfer: number): number {
  if (waitMinutesAtTransfer < 2) return -10;
  if (waitMinutesAtTransfer <= 4) return 0;
  return 5;
}

function timeOfDayAdjustment(now: Date): number {
  return isPeakHour(now) ? -10 : 5;
}

function clampScore(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function annotateReliability(it: TransitItinerary, now: Date): TransitItinerary {
  const tod = timeOfDayAdjustment(now);
  const annotated: TransitLeg[] = it.legs.map((leg, idx) => {
    if (leg.mode === 'walk') {
      return { ...leg, reliabilityScore: clampScore(85 - 15) };
    }
    if (leg.mode === 'mrt') {
      // MRT is generally reliable. Still apply wait + tod.
      const base = waitScore(leg.waitMinutes);
      return { ...leg, reliabilityScore: clampScore(base + tod + 5) };
    }
    // bus
    let score = waitScore(leg.waitMinutes);
    score += leg.liveData ? 10 : 0;
    score += tod;
    if (idx > 0) {
      // Find the previous bus leg to determine slack.
      // The wait at this leg already represents slack at the transfer.
      score += transferSlackBonus(leg.waitMinutes);
    }
    return { ...leg, reliabilityScore: clampScore(score) };
  });

  const min = annotated.reduce((acc, l) => {
    const s = l.reliabilityScore ?? 100;
    return s < acc ? s : acc;
  }, 100);
  let confidence: ConfidenceLevel;
  if (min >= 75) confidence = 'high';
  else if (min >= 55) confidence = 'medium';
  else confidence = 'low';

  return { ...it, legs: annotated, confidence };
}

// ─────────────────────────────────────────────────────────────────────────────

export function planTransit(input: PlanInput): TransitItinerary[] {
  const now = input.now ?? new Date();
  const originStops = originStopOptions(input.topology, input.origin);
  const destStops = destStopOptions(input.topology, input.dest);

  if (originStops.length === 0 || destStops.length === 0) {
    return buildMrtCandidates(input, now).map((it) => annotateReliability(it, now));
  }

  const direct = buildDirectCandidates(input, originStops, destStops);
  const transfers = buildOneTransferCandidates(input, originStops, destStops);
  const transfersWalk = buildOneTransferWithWalkCandidates(
    input,
    originStops,
    destStops,
  );
  const twoTransfers = buildTwoTransferCandidates(input, originStops, destStops);
  const mrt = buildMrtCandidates(input, now);

  const all = [...direct, ...transfers, ...transfersWalk, ...twoTransfers, ...mrt];

  const dedup = new Map<string, TransitItinerary>();
  for (const it of all) {
    const sig = it.legs
      .map((l) =>
        l.mode === 'bus'
          ? `b${l.serviceNo}:${l.fromCode}>${l.toCode}`
          : l.mode === 'mrt'
            ? `m:${l.fromName}>${l.toName}`
            : `w:${l.fromCode ?? l.fromName}>${l.toCode ?? l.toName}`,
      )
      .join('|');
    const existing = dedup.get(sig);
    if (!existing || it.totalMinutes < existing.totalMinutes) dedup.set(sig, it);
  }

  // Sort by total time, then ensure category diversity: reserve one slot each
  // for the fastest walking-transfer and the fastest 2-transfer plan if any
  // exist, so users see option variety rather than a homogenous Pareto front.
  const sorted = Array.from(dedup.values()).sort(
    (a, b) => a.totalMinutes - b.totalMinutes,
  );

  function categorize(it: TransitItinerary): 'direct' | 'xfer1' | 'xfer1-walk' | 'xfer2' | 'mrt' | 'other' {
    const busLegs = it.legs.filter((l) => l.mode === 'bus').length;
    const walkLegs = it.legs.filter((l) => l.mode === 'walk').length;
    const mrtLegs = it.legs.filter((l) => l.mode === 'mrt').length;
    if (mrtLegs > 0) return 'mrt';
    if (busLegs === 1) return 'direct';
    if (busLegs === 2 && walkLegs === 0) return 'xfer1';
    if (busLegs === 2 && walkLegs >= 1) return 'xfer1-walk';
    if (busLegs >= 3) return 'xfer2';
    return 'other';
  }

  const picked: TransitItinerary[] = [];
  const pickedIds = new Set<string>();
  // Greedy: take fastest of each category to seed diversity.
  const seedCats: Array<ReturnType<typeof categorize>> = [
    'direct',
    'xfer1',
    'xfer1-walk',
    'xfer2',
    'mrt',
  ];
  for (const cat of seedCats) {
    const found = sorted.find((it) => categorize(it) === cat && !pickedIds.has(it.id));
    if (found) {
      picked.push(found);
      pickedIds.add(found.id);
    }
  }
  // Fill remaining slots from sorted list.
  for (const it of sorted) {
    if (picked.length >= MAX_RESULTS) break;
    if (pickedIds.has(it.id)) continue;
    picked.push(it);
    pickedIds.add(it.id);
  }
  // Final sort by time so output is presented fastest-first.
  picked.sort((a, b) => a.totalMinutes - b.totalMinutes);

  return picked.map((it) => annotateReliability(it, now));
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

// Re-export constants for tests / callers.
export { TRANSFER_WALK_THRESHOLD_KM, WALK_THRESHOLD_KM };
