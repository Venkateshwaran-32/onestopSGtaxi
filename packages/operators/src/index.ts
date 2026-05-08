import type { OperatorId, OperatorMeta, Route } from '@onestopsgtaxi/shared';

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

export interface DeeplinkInput {
  pickup: Route['pickup'];
  dropoff: Route['dropoff'];
  ref?: string;
}

type DeeplinkBuilder = (input: DeeplinkInput) => string;

const STUB_BUILDER: DeeplinkBuilder = () => '';

export const DEEPLINK_BUILDERS: Record<OperatorId, DeeplinkBuilder> = {
  grab: STUB_BUILDER,
  gojek: STUB_BUILDER,
  tada: STUB_BUILDER,
  ryde: STUB_BUILDER,
  zig: STUB_BUILDER,
  geolah: STUB_BUILDER,
  transcab: STUB_BUILDER,
  cdg: STUB_BUILDER,
};

export function buildDeeplink(operatorId: OperatorId, input: DeeplinkInput): string {
  return DEEPLINK_BUILDERS[operatorId](input);
}
