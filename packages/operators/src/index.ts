import type { OperatorId, OperatorMeta } from '@onestopsgtaxi/shared';

export const OPERATORS: Record<OperatorId, OperatorMeta> = {
  grab: {
    id: 'grab',
    displayName: 'Grab',
    brandColor: '#00B14F',
    logoSlug: 'grab',
    category: 'phv',
  },
  gojek: {
    id: 'gojek',
    displayName: 'Gojek',
    brandColor: '#00AA13',
    logoSlug: 'gojek',
    category: 'phv',
  },
  tada: {
    id: 'tada',
    displayName: 'TADA',
    brandColor: '#FF3D33',
    logoSlug: 'tada',
    category: 'phv',
  },
  ryde: {
    id: 'ryde',
    displayName: 'Ryde',
    brandColor: '#FFB800',
    logoSlug: 'ryde',
    category: 'phv',
  },
  zig: {
    id: 'zig',
    displayName: 'Zig',
    brandColor: '#F4364C',
    logoSlug: 'zig',
    category: 'taxi',
  },
  geolah: {
    id: 'geolah',
    displayName: 'Geolah',
    brandColor: '#1A73E8',
    logoSlug: 'geolah',
    category: 'phv',
  },
  transcab: {
    id: 'transcab',
    displayName: 'Trans-Cab',
    brandColor: '#FFC107',
    logoSlug: 'transcab',
    category: 'taxi',
  },
  cdg: {
    id: 'cdg',
    displayName: 'ComfortDelGro',
    brandColor: '#003DA5',
    logoSlug: 'cdg',
    category: 'taxi',
  },
};

export const ALL_OPERATOR_IDS: OperatorId[] = Object.keys(OPERATORS) as OperatorId[];

export {
  buildDeeplink,
  getStoreUrl,
  DEEPLINK_BUILDERS,
  OPERATOR_LINKS,
} from './deeplinks';
export type { DeeplinkInput, OperatorLinks } from './deeplinks';
