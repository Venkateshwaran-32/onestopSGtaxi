import { indexTopology, type TopologyData, type TopologyIndex } from './topology';
import topologyData from '@/data/sg-bus-topology.json';

let cachedIndex: TopologyIndex | null = null;

const data = topologyData as unknown as TopologyData;
const isDemo = (data.stops?.length ?? 0) < 100;

export async function loadTopology(): Promise<{ index: TopologyIndex; source: 'full' | 'demo' }> {
  if (!cachedIndex) {
    cachedIndex = indexTopology(data);
  }
  return { index: cachedIndex, source: isDemo ? 'demo' : 'full' };
}
