export type OperatorId =
  | 'grab'
  | 'gojek'
  | 'tada'
  | 'ryde'
  | 'zig'
  | 'geolah'
  | 'transcab'
  | 'cdg';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Place {
  label: string;
  address: string;
  coords: LatLng;
  placeId?: string;
}

export interface Route {
  pickup: Place;
  dropoff: Place;
  distanceKm: number;
  durationMinutes: number;
  polyline?: string;
}

export interface QuoteContext {
  now: Date;
  weather?: 'clear' | 'rain' | 'heavy_rain';
}

export type Confidence = 'HIGH' | 'MEDIUM' | 'LOW';

export interface FareRange {
  low: number;
  mid: number;
  high: number;
}

export interface FareBreakdown {
  base: number;
  perKm: number;
  perMin: number;
  bookingFee: number;
}

export interface Quote {
  operatorId: OperatorId;
  fareSGD: FareRange;
  etaMinutes: number;
  confidence: Confidence;
  surgeMultiplier: number;
  breakdown: FareBreakdown;
  disclaimer: string;
  deeplink: string;
}

export interface ForecastPoint {
  offsetMinutes: number;
  fareSGD: number;
  surgeMultiplier: number;
}

export type VehicleCategory = 'taxi' | 'phv';

export interface OperatorMeta {
  id: OperatorId;
  displayName: string;
  brandColor: string;
  logoSlug: string;
  category: VehicleCategory;
  iosAppStoreId?: string;
  androidPackageId?: string;
}
