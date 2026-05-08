import type { OperatorId, OperatorMeta } from '@onestopsgtaxi/shared';

export const OPERATORS: Record<OperatorId, OperatorMeta> = {
  grab: {
    id: 'grab',
    displayName: 'Grab',
    brandColor: '#00B14F',
    logoSlug: 'grab',
  },
  gojek: {
    id: 'gojek',
    displayName: 'Gojek',
    brandColor: '#00AA13',
    logoSlug: 'gojek',
  },
  tada: {
    id: 'tada',
    displayName: 'TADA',
    brandColor: '#FF3D33',
    logoSlug: 'tada',
  },
  ryde: {
    id: 'ryde',
    displayName: 'Ryde',
    brandColor: '#FFB800',
    logoSlug: 'ryde',
  },
  zig: {
    id: 'zig',
    displayName: 'Zig',
    brandColor: '#F4364C',
    logoSlug: 'zig',
  },
  geolah: {
    id: 'geolah',
    displayName: 'Geolah',
    brandColor: '#1A73E8',
    logoSlug: 'geolah',
  },
  transcab: {
    id: 'transcab',
    displayName: 'Trans-Cab',
    brandColor: '#FFC107',
    logoSlug: 'transcab',
  },
  cdg: {
    id: 'cdg',
    displayName: 'ComfortDelGro',
    brandColor: '#003DA5',
    logoSlug: 'cdg',
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
