import type { LatLng, Place } from '@onestopsgtaxi/shared';
import { haversineDistanceKm, estimateDurationMinutes } from './geo';

const ROAD_DETOUR = 1.35;
const BASELINE_BASE = 3.5;
const BASELINE_PER_KM = 0.55;
const BASELINE_PER_MIN = 0.2;

function legDistanceKm(a: LatLng, b: LatLng): number {
  return haversineDistanceKm(a, b) * ROAD_DETOUR;
}

function totalRouteCost(order: Place[]): { distanceKm: number; minutes: number; fareSGD: number } {
  let distanceKm = 0;
  let minutes = 0;
  for (let i = 0; i < order.length - 1; i++) {
    const a = order[i]!;
    const b = order[i + 1]!;
    const d = legDistanceKm(a.coords, b.coords);
    distanceKm += d;
    minutes += estimateDurationMinutes(haversineDistanceKm(a.coords, b.coords));
  }
  const fareSGD = BASELINE_BASE + BASELINE_PER_KM * distanceKm + BASELINE_PER_MIN * minutes;
  return { distanceKm, minutes, fareSGD: Math.round(fareSGD * 100) / 100 };
}

function* permutations<T>(items: T[]): Generator<T[]> {
  if (items.length <= 1) {
    yield items.slice();
    return;
  }
  for (let i = 0; i < items.length; i++) {
    const item = items[i]!;
    const rest = [...items.slice(0, i), ...items.slice(i + 1)];
    for (const perm of permutations(rest)) {
      yield [item, ...perm];
    }
  }
}

export interface SplitResult {
  bestOrder: Place[];
  worstOrder: Place[];
  bestCost: { distanceKm: number; minutes: number; fareSGD: number };
  worstCost: { distanceKm: number; minutes: number; fareSGD: number };
  savedSGD: number;
  savedKm: number;
}

export const MAX_DROPOFFS = 6;

export function optimizeMultiStop(pickup: Place, dropoffs: Place[]): SplitResult | null {
  if (dropoffs.length === 0) return null;
  if (dropoffs.length > MAX_DROPOFFS) {
    throw new Error(`Maximum ${MAX_DROPOFFS} dropoffs supported per optimization.`);
  }

  type Candidate = { order: Place[]; cost: ReturnType<typeof totalRouteCost> };
  let best: Candidate | null = null;
  let worst: Candidate | null = null;

  for (const perm of permutations(dropoffs)) {
    const order = [pickup, ...perm];
    const cost = totalRouteCost(order);
    if (!best || cost.fareSGD < best.cost.fareSGD) best = { order, cost };
    if (!worst || cost.fareSGD > worst.cost.fareSGD) worst = { order, cost };
  }

  if (!best || !worst) return null;

  return {
    bestOrder: best.order,
    worstOrder: worst.order,
    bestCost: best.cost,
    worstCost: worst.cost,
    savedSGD: Math.round((worst.cost.fareSGD - best.cost.fareSGD) * 100) / 100,
    savedKm: Math.round((worst.cost.distanceKm - best.cost.distanceKm) * 100) / 100,
  };
}
