import type { Place } from '@onestopsgtaxi/shared';
import { searchPlaces, SG_PLACES } from './sg-places';

export interface VoiceParseResult {
  pickup: Place | null;
  dropoff: Place | null;
  pickupHint?: string;
  dropoffHint?: string;
}

const FILLER_WORDS = new Set([
  'i',
  "i'm",
  'im',
  'want',
  'need',
  'a',
  'an',
  'the',
  'taxi',
  'cab',
  'ride',
  'go',
  'going',
  'get',
  'getting',
  'me',
  'please',
  'pls',
  'now',
  'asap',
  'singapore',
  'sg',
  'find',
  'cheapest',
  'fastest',
  'one',
]);

function clean(text: string): string {
  return text
    .toLowerCase()
    .replace(/[?!.,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripFillers(fragment: string): string {
  return fragment
    .split(' ')
    .filter((token, idx, all) => {
      if (idx > 0 && idx < all.length - 1 && FILLER_WORDS.has(token)) return false;
      return true;
    })
    .join(' ')
    .trim();
}

function bestPlaceMatch(fragment: string, recent: Place[]): Place | null {
  const fragLower = fragment.toLowerCase().trim();
  if (!fragLower) return null;

  const allCandidates = [...recent, ...SG_PLACES];
  let best: { place: Place; score: number } | null = null;
  for (const place of allCandidates) {
    const labelLower = place.label.toLowerCase();
    let score = 0;
    if (labelLower === fragLower) score = 100;
    else if (labelLower.startsWith(fragLower)) score = 60;
    else if (labelLower.includes(fragLower)) score = 35;
    else if (fragLower.includes(labelLower)) score = 30;
    else {
      const labelTokens = labelLower.split(/\s+/);
      const fragTokens = fragLower.split(/\s+/).filter((t) => t.length > 2);
      const overlap = fragTokens.filter((t) => labelTokens.some((lt) => lt.startsWith(t)));
      if (overlap.length > 0) score = 10 + overlap.length * 4;
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { place, score };
    }
  }
  return best && best.score >= 10 ? best.place : null;
}

const SPLIT_PATTERNS = [
  /\bfrom\s+(.+?)\s+to\s+(.+)/,
  /\b(.+?)\s+to\s+(.+)/,
  /\b(.+?)\s+(?:into|towards?)\s+(.+)/,
];

export function parseVoiceQuery(transcript: string, recent: Place[] = []): VoiceParseResult {
  const normalised = clean(transcript);

  for (const pattern of SPLIT_PATTERNS) {
    const m = normalised.match(pattern);
    if (m && m[1] && m[2]) {
      const pickupFragment = stripFillers(m[1]);
      const dropoffFragment = stripFillers(m[2]);
      return {
        pickup: bestPlaceMatch(pickupFragment, recent),
        dropoff: bestPlaceMatch(dropoffFragment, recent),
        pickupHint: pickupFragment,
        dropoffHint: dropoffFragment,
      };
    }
  }

  const candidate = stripFillers(normalised);
  if (candidate) {
    return {
      pickup: null,
      dropoff: bestPlaceMatch(candidate, recent),
      dropoffHint: candidate,
    };
  }

  return { pickup: null, dropoff: null };
}

export function _testHelpers() {
  return { bestPlaceMatch, stripFillers, clean, searchPlaces };
}
