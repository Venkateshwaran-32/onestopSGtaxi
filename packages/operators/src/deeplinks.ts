import type { OperatorId, Place } from '@onestopsgtaxi/shared';

export interface DeeplinkInput {
  pickup: Place;
  dropoff: Place;
  ref?: string;
}

export interface OperatorLinks {
  iosScheme?: string;
  iosAppStoreUrl: string;
  androidPackageId?: string;
  androidPlayStoreUrl: string;
  webFallback: string;
}

export const OPERATOR_LINKS: Record<OperatorId, OperatorLinks> = {
  grab: {
    iosScheme: 'grab://',
    iosAppStoreUrl: 'https://apps.apple.com/app/grab/id647268330',
    androidPackageId: 'com.grabtaxi.passenger',
    androidPlayStoreUrl:
      'https://play.google.com/store/apps/details?id=com.grabtaxi.passenger',
    webFallback: 'https://www.grab.com/sg/transport/',
  },
  gojek: {
    iosScheme: 'gojek://',
    iosAppStoreUrl: 'https://apps.apple.com/app/gojek/id944875099',
    androidPackageId: 'com.gojek.app',
    androidPlayStoreUrl: 'https://play.google.com/store/apps/details?id=com.gojek.app',
    webFallback: 'https://www.gojek.com/sg/',
  },
  tada: {
    iosScheme: 'tada://',
    iosAppStoreUrl: 'https://apps.apple.com/app/tada-rider/id1437140928',
    androidPackageId: 'global.tada.passenger',
    androidPlayStoreUrl:
      'https://play.google.com/store/apps/details?id=global.tada.passenger',
    webFallback: 'https://tada.global/',
  },
  ryde: {
    iosScheme: 'ryde://',
    iosAppStoreUrl: 'https://apps.apple.com/app/ryde/id1110765217',
    androidPackageId: 'com.rydesharing.ryde',
    androidPlayStoreUrl:
      'https://play.google.com/store/apps/details?id=com.rydesharing.ryde',
    webFallback: 'https://www.rydesharing.com/',
  },
  zig: {
    iosScheme: 'cdgzig://',
    iosAppStoreUrl: 'https://apps.apple.com/sg/app/zig/id1623727088',
    androidPackageId: 'sg.com.cdg.zig',
    androidPlayStoreUrl: 'https://play.google.com/store/apps/details?id=sg.com.cdg.zig',
    webFallback: 'https://www.zigapp.com/',
  },
  geolah: {
    iosScheme: 'geolah://',
    iosAppStoreUrl: 'https://apps.apple.com/sg/app/geolah/id1577632927',
    androidPackageId: 'com.geolah.passenger',
    androidPlayStoreUrl:
      'https://play.google.com/store/apps/details?id=com.geolah.passenger',
    webFallback: 'https://www.geolah.com.sg/',
  },
  transcab: {
    iosScheme: 'transcab://',
    iosAppStoreUrl: 'https://apps.apple.com/sg/app/transcab/id6443720023',
    androidPackageId: 'com.transcab.passenger',
    androidPlayStoreUrl:
      'https://play.google.com/store/apps/details?id=com.transcab.passenger',
    webFallback: 'https://transcab.com.sg/',
  },
  cdg: {
    iosScheme: 'cdg://',
    iosAppStoreUrl: 'https://apps.apple.com/sg/app/comfortdelgro/id412422463',
    androidPackageId: 'com.comfortdelgro.taxibooking',
    androidPlayStoreUrl:
      'https://play.google.com/store/apps/details?id=com.comfortdelgro.taxibooking',
    webFallback: 'https://www.cdgtaxi.com.sg/',
  },
};

function tryAppendQuery(
  scheme: string,
  pickup: Place,
  dropoff: Place,
  ref?: string,
): string {
  const params = new URLSearchParams();
  params.set('pickupLatitude', String(pickup.coords.lat));
  params.set('pickupLongitude', String(pickup.coords.lng));
  params.set('pickupAddress', pickup.address);
  params.set('dropoffLatitude', String(dropoff.coords.lat));
  params.set('dropoffLongitude', String(dropoff.coords.lng));
  params.set('dropoffAddress', dropoff.address);
  if (ref) params.set('ref', ref);
  const sep = scheme.endsWith('://') ? '' : '?';
  const querySep = scheme.includes('?') ? '&' : sep === '' ? '?' : sep;
  return `${scheme}${sep}${querySep === '?' && scheme.endsWith('://') ? '?' : querySep}${params.toString()}`;
}

const grabBuilder = (input: DeeplinkInput) => {
  const params = new URLSearchParams({
    sourceLatitude: String(input.pickup.coords.lat),
    sourceLongitude: String(input.pickup.coords.lng),
    pickup: input.pickup.address,
    dropOffLatitude: String(input.dropoff.coords.lat),
    dropOffLongitude: String(input.dropoff.coords.lng),
    dropOff: input.dropoff.address,
  });
  return `https://open.grab.com/?${params.toString()}`;
};

const generic = (operatorId: OperatorId): ((input: DeeplinkInput) => string) => {
  const links = OPERATOR_LINKS[operatorId];
  return (input: DeeplinkInput) => {
    if (links.iosScheme) {
      return tryAppendQuery(links.iosScheme, input.pickup, input.dropoff, input.ref);
    }
    return links.webFallback;
  };
};

type DeeplinkBuilder = (input: DeeplinkInput) => string;

export const DEEPLINK_BUILDERS: Record<OperatorId, DeeplinkBuilder> = {
  grab: grabBuilder,
  gojek: generic('gojek'),
  tada: generic('tada'),
  ryde: generic('ryde'),
  zig: generic('zig'),
  geolah: generic('geolah'),
  transcab: generic('transcab'),
  cdg: generic('cdg'),
};

export function buildDeeplink(operatorId: OperatorId, input: DeeplinkInput): string {
  return DEEPLINK_BUILDERS[operatorId](input);
}

export function getStoreUrl(operatorId: OperatorId, platform: 'ios' | 'android'): string {
  return platform === 'ios'
    ? OPERATOR_LINKS[operatorId].iosAppStoreUrl
    : OPERATOR_LINKS[operatorId].androidPlayStoreUrl;
}
