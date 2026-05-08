import type { LatLng } from '@onestopsgtaxi/shared';

export interface MrtStation {
  id: string;
  name: string;
  coords: LatLng;
  lines: string[];
}

/**
 * Popular SG MRT stations with approximate coordinates.
 * V1 covers ~35 high-traffic stations. Sufficient for last-mile combo
 * computation; LTA DataMall integration would give the full network.
 */
export const MRT_STATIONS: MrtStation[] = [
  // North-South Line core
  { id: 'NS1', name: 'Jurong East MRT', coords: { lat: 1.3329, lng: 103.7423 }, lines: ['NS', 'EW'] },
  { id: 'NS17', name: 'Bishan MRT', coords: { lat: 1.351, lng: 103.8485 }, lines: ['NS', 'CC'] },
  { id: 'NS18', name: 'Braddell MRT', coords: { lat: 1.3404, lng: 103.847 }, lines: ['NS'] },
  { id: 'NS19', name: 'Toa Payoh MRT', coords: { lat: 1.3327, lng: 103.8474 }, lines: ['NS'] },
  { id: 'NS21', name: 'Newton MRT', coords: { lat: 1.3128, lng: 103.838 }, lines: ['NS', 'DT'] },
  { id: 'NS22', name: 'Orchard MRT', coords: { lat: 1.3043, lng: 103.8318 }, lines: ['NS', 'TE'] },
  { id: 'NS24', name: 'Dhoby Ghaut MRT', coords: { lat: 1.299, lng: 103.8454 }, lines: ['NS', 'NE', 'CC'] },
  { id: 'NS25', name: 'City Hall MRT', coords: { lat: 1.293, lng: 103.852 }, lines: ['NS', 'EW'] },
  { id: 'NS26', name: 'Raffles Place MRT', coords: { lat: 1.2842, lng: 103.8514 }, lines: ['NS', 'EW'] },
  { id: 'NS27', name: 'Marina Bay MRT', coords: { lat: 1.2766, lng: 103.8546 }, lines: ['NS', 'CE', 'TE'] },

  // East-West Line core
  { id: 'EW1', name: 'Pasir Ris MRT', coords: { lat: 1.3727, lng: 103.9494 }, lines: ['EW'] },
  { id: 'EW2', name: 'Tampines MRT', coords: { lat: 1.3536, lng: 103.9446 }, lines: ['EW', 'DT'] },
  { id: 'EW5', name: 'Bedok MRT', coords: { lat: 1.3239, lng: 103.9302 }, lines: ['EW'] },
  { id: 'EW8', name: 'Paya Lebar MRT', coords: { lat: 1.3179, lng: 103.8929 }, lines: ['EW', 'CC'] },
  { id: 'EW12', name: 'Bugis MRT', coords: { lat: 1.3005, lng: 103.8559 }, lines: ['EW', 'DT'] },
  { id: 'EW16', name: 'Outram Park MRT', coords: { lat: 1.2807, lng: 103.8395 }, lines: ['EW', 'NE', 'TE'] },
  { id: 'EW21', name: 'Buona Vista MRT', coords: { lat: 1.3072, lng: 103.7903 }, lines: ['EW', 'CC'] },
  { id: 'EW23', name: 'Clementi MRT', coords: { lat: 1.3151, lng: 103.7649 }, lines: ['EW'] },
  { id: 'EW27', name: 'Boon Lay MRT', coords: { lat: 1.3387, lng: 103.706 }, lines: ['EW'] },
  { id: 'CG2', name: 'Changi Airport MRT', coords: { lat: 1.3573, lng: 103.9885 }, lines: ['EW'] },

  // North-East Line
  { id: 'NE1', name: 'HarbourFront MRT', coords: { lat: 1.2653, lng: 103.822 }, lines: ['NE', 'CC'] },
  { id: 'NE3', name: 'Outram Park (NE)', coords: { lat: 1.2807, lng: 103.8395 }, lines: ['NE', 'EW', 'TE'] },
  { id: 'NE5', name: 'Clarke Quay MRT', coords: { lat: 1.2884, lng: 103.8466 }, lines: ['NE'] },
  { id: 'NE7', name: 'Little India MRT', coords: { lat: 1.3066, lng: 103.8492 }, lines: ['NE', 'DT'] },
  { id: 'NE12', name: 'Serangoon MRT', coords: { lat: 1.3499, lng: 103.8736 }, lines: ['NE', 'CC'] },
  { id: 'NE16', name: 'Sengkang MRT', coords: { lat: 1.3917, lng: 103.8954 }, lines: ['NE'] },
  { id: 'NE17', name: 'Punggol MRT', coords: { lat: 1.4053, lng: 103.9023 }, lines: ['NE'] },

  // Circle Line / Downtown / Thomson-East Coast extras
  { id: 'CC22', name: 'Holland Village MRT', coords: { lat: 1.3115, lng: 103.7959 }, lines: ['CC'] },
  { id: 'CC4', name: 'Promenade MRT', coords: { lat: 1.293, lng: 103.8612 }, lines: ['CC', 'DT'] },
  { id: 'TE17', name: 'Maxwell MRT', coords: { lat: 1.2807, lng: 103.8443 }, lines: ['TE'] },
  { id: 'CE1', name: 'Bayfront MRT', coords: { lat: 1.2829, lng: 103.8593 }, lines: ['CE', 'DT'] },
  { id: 'NS9', name: 'Woodlands MRT', coords: { lat: 1.4371, lng: 103.7864 }, lines: ['NS', 'TE'] },
  { id: 'NS13', name: 'Yishun MRT', coords: { lat: 1.4296, lng: 103.835 }, lines: ['NS'] },
  { id: 'NS16', name: 'Ang Mo Kio MRT', coords: { lat: 1.3697, lng: 103.8496 }, lines: ['NS'] },
  { id: 'EW24', name: 'Jurong East (EW)', coords: { lat: 1.3329, lng: 103.7423 }, lines: ['EW', 'NS'] },
];
