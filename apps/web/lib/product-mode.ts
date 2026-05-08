export type ProductMode = 'taxi' | 'sgbuses';

const VALID_MODES: ProductMode[] = ['taxi', 'sgbuses'];

export function getProductMode(): ProductMode {
  const raw = process.env.NEXT_PUBLIC_PRODUCT_MODE as ProductMode | undefined;
  if (raw && VALID_MODES.includes(raw)) return raw;
  return 'taxi';
}

interface ProductBranding {
  name: string;
  shortName: string;
  homeRoute: '/' | '/transit';
  navItems: Array<'compare' | 'transit' | 'plan' | 'combo' | 'split' | 'spend' | 'saved' | 'reverse'>;
  tagline: string;
  description: string;
}

const BRANDING: Record<ProductMode, ProductBranding> = {
  taxi: {
    name: 'OneStopSGTaxi',
    shortName: 'OneStopSGTaxi',
    homeRoute: '/',
    navItems: ['transit', 'plan', 'combo', 'split', 'reverse', 'spend', 'saved'],
    tagline: 'Compare ride-hail fares in Singapore',
    description:
      'Compare fares and ETAs across Grab, Gojek, TADA, Ryde, Zig, Geolah, and Trans-Cab in one place. Find the cheapest ride, faster.',
  },
  sgbuses: {
    name: 'SGBuses',
    shortName: 'SGBuses',
    homeRoute: '/transit',
    navItems: ['transit', 'saved'],
    tagline: 'Faster than the next direct bus',
    description:
      'Live-arrival aware bus + MRT planning for Singapore. Looks at LTA real-time data and finds the combination Google Maps misses.',
  },
};

export function getProductBranding(): ProductBranding {
  return BRANDING[getProductMode()];
}
