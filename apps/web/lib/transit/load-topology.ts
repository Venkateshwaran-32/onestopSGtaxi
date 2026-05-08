import { indexTopology, type TopologyData, type TopologyIndex } from './topology';
import demo from '@/data/sg-bus-topology.demo.json';

let cachedIndex: TopologyIndex | null = null;
let cachedSource: 'full' | 'demo' = 'demo';

async function tryLoadFull(): Promise<TopologyData | null> {
  try {
    const mod = await import('@/data/sg-bus-topology.json' as string).catch(() => null);
    if (!mod) return null;
    return (mod.default ?? mod) as TopologyData;
  } catch {
    return null;
  }
}

export async function loadTopology(): Promise<{ index: TopologyIndex; source: 'full' | 'demo' }> {
  if (cachedIndex) return { index: cachedIndex, source: cachedSource };
  const full = await tryLoadFull();
  const data: TopologyData = full ?? (demo as unknown as TopologyData);
  cachedSource = full ? 'full' : 'demo';
  cachedIndex = indexTopology(data);
  return { index: cachedIndex, source: cachedSource };
}
