import type { Place } from '@onestopsgtaxi/shared';

export const SG_PLACES: Place[] = [
  {
    label: 'Orchard MRT Station',
    address: 'Orchard Rd, Singapore',
    coords: { lat: 1.3043, lng: 103.8318 },
  },
  {
    label: 'Changi Airport Terminal 1',
    address: '80 Airport Blvd, Singapore 819642',
    coords: { lat: 1.3641, lng: 103.9915 },
  },
  {
    label: 'Changi Airport Terminal 2',
    address: '60 Airport Blvd, Singapore 819643',
    coords: { lat: 1.3568, lng: 103.9874 },
  },
  {
    label: 'Changi Airport Terminal 3',
    address: '65 Airport Blvd, Singapore 819663',
    coords: { lat: 1.3554, lng: 103.9842 },
  },
  {
    label: 'Marina Bay Sands',
    address: '10 Bayfront Ave, Singapore 018956',
    coords: { lat: 1.2834, lng: 103.8607 },
  },
  {
    label: 'Raffles Place MRT',
    address: 'Raffles Pl, Singapore',
    coords: { lat: 1.2842, lng: 103.8514 },
  },
  {
    label: 'Sentosa (VivoCity)',
    address: '1 HarbourFront Walk, Singapore 098585',
    coords: { lat: 1.2643, lng: 103.8222 },
  },
  {
    label: 'Jurong East MRT',
    address: 'Jurong East, Singapore',
    coords: { lat: 1.3329, lng: 103.7423 },
  },
  {
    label: 'Tampines MRT',
    address: 'Tampines Central, Singapore',
    coords: { lat: 1.3536, lng: 103.9446 },
  },
  {
    label: 'Woodlands MRT',
    address: 'Woodlands, Singapore',
    coords: { lat: 1.4371, lng: 103.7864 },
  },
  {
    label: 'Bishan MRT',
    address: 'Bishan, Singapore',
    coords: { lat: 1.351, lng: 103.8485 },
  },
  {
    label: 'NUS (Kent Ridge)',
    address: '21 Lower Kent Ridge Rd, Singapore 119077',
    coords: { lat: 1.2966, lng: 103.7764 },
  },
  {
    label: 'Singapore General Hospital',
    address: 'Outram Rd, Singapore 169608',
    coords: { lat: 1.2792, lng: 103.8358 },
  },
  {
    label: 'Gardens by the Bay',
    address: '18 Marina Gardens Dr, Singapore 018953',
    coords: { lat: 1.2816, lng: 103.8636 },
  },
  {
    label: 'Bugis MRT',
    address: 'Bugis, Singapore',
    coords: { lat: 1.3005, lng: 103.8559 },
  },
  {
    label: 'Clarke Quay',
    address: 'Clarke Quay, Singapore',
    coords: { lat: 1.2884, lng: 103.8466 },
  },
  {
    label: 'Bedok MRT',
    address: 'Bedok, Singapore',
    coords: { lat: 1.3239, lng: 103.9302 },
  },
  {
    label: 'Yishun MRT',
    address: 'Yishun, Singapore',
    coords: { lat: 1.4296, lng: 103.835 },
  },
  {
    label: 'Punggol MRT',
    address: 'Punggol, Singapore',
    coords: { lat: 1.4053, lng: 103.9023 },
  },
  {
    label: 'HarbourFront MRT',
    address: 'HarbourFront, Singapore',
    coords: { lat: 1.2653, lng: 103.822 },
  },
];

export function searchPlaces(query: string, limit = 8): Place[] {
  const q = query.trim().toLowerCase();
  if (!q) return SG_PLACES.slice(0, limit);

  const scored = SG_PLACES.map((place) => {
    const labelLower = place.label.toLowerCase();
    const addressLower = place.address.toLowerCase();
    let score = 0;
    if (labelLower.startsWith(q)) score += 10;
    else if (labelLower.includes(q)) score += 6;
    if (addressLower.includes(q)) score += 2;
    return { place, score };
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.place);

  return scored;
}
