/**
 * One-shot fetch of LTA DataMall bus topology.
 *
 * Usage:
 *   LTA_DATAMALL_KEY=your-key-here pnpm topology:fetch
 *
 * Writes to apps/web/data/sg-bus-topology.json. Skip-protected: refuses to
 * overwrite if the new fetch is materially smaller (e.g. half-failed).
 */

import { mkdirSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

interface DataMallStopApi {
  BusStopCode: string;
  RoadName: string;
  Description: string;
  Latitude: number;
  Longitude: number;
}

interface DataMallServiceApi {
  ServiceNo: string;
  Operator: string;
  Direction: 1 | 2;
  Category: string;
  LoopDesc?: string;
}

interface DataMallRouteApi {
  ServiceNo: string;
  Operator: string;
  Direction: 1 | 2;
  StopSequence: number;
  BusStopCode: string;
  Distance: number;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const OUTPUT = resolve(__dirname, '../data/sg-bus-topology.json');
const ENDPOINT = 'https://datamall2.mytransport.sg/ltaodataservice';
const PAGE_SIZE = 500;

async function fetchPaged<T>(path: string, key: string): Promise<T[]> {
  const out: T[] = [];
  let skip = 0;
  while (true) {
    const url = `${ENDPOINT}/${path}?$skip=${skip}`;
    const res = await fetch(url, {
      headers: { AccountKey: key, accept: 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`${path} returned ${res.status}: ${await res.text()}`);
    }
    const data = (await res.json()) as { value?: T[] };
    const page = data.value ?? [];
    out.push(...page);
    if (page.length < PAGE_SIZE) break;
    skip += PAGE_SIZE;
    process.stdout.write(`  ${path}: ${out.length}\r`);
  }
  process.stdout.write(`  ${path}: ${out.length}\n`);
  return out;
}

async function main() {
  const key = process.env.LTA_DATAMALL_KEY;
  if (!key) {
    console.error('LTA_DATAMALL_KEY env var is required.');
    console.error('Sign up at https://datamall.lta.gov.sg/ to get one.');
    process.exit(1);
  }

  console.log('Fetching LTA DataMall topology...');
  const [stopsRaw, servicesRaw, routesRaw] = await Promise.all([
    fetchPaged<DataMallStopApi>('BusStops', key),
    fetchPaged<DataMallServiceApi>('BusServices', key),
    fetchPaged<DataMallRouteApi>('BusRoutes', key),
  ]);

  const data = {
    generatedAt: new Date().toISOString(),
    stops: stopsRaw.map((s) => ({
      code: s.BusStopCode,
      name: s.Description,
      road: s.RoadName,
      coords: { lat: s.Latitude, lng: s.Longitude },
    })),
    services: servicesRaw.map((s) => ({
      serviceNo: s.ServiceNo,
      operator: s.Operator,
      category: s.Category,
      loopDescription: s.LoopDesc,
    })),
    routes: routesRaw.map((r) => ({
      serviceNo: r.ServiceNo,
      direction: r.Direction,
      stopSequence: r.StopSequence,
      busStopCode: r.BusStopCode,
      distanceKm: r.Distance,
    })),
  };

  if (existsSync(OUTPUT)) {
    const prev = statSync(OUTPUT).size;
    const next = JSON.stringify(data).length;
    if (next < prev * 0.7) {
      console.error(
        `Refusing to overwrite — new file (${next}) is much smaller than existing (${prev}). ` +
          `Looks like a partial fetch. Re-run.`,
      );
      process.exit(1);
    }
  }

  mkdirSync(dirname(OUTPUT), { recursive: true });
  writeFileSync(OUTPUT, JSON.stringify(data, null, 0));
  console.log(`\nWrote ${data.stops.length} stops, ${data.services.length} services, ${data.routes.length} routes`);
  console.log(`→ ${OUTPUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
