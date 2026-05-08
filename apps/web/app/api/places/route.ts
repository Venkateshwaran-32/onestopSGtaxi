import { NextResponse } from 'next/server';
import type { Place } from '@onestopsgtaxi/shared';
import { searchPlaces } from '@/lib/sg-places';

export const runtime = 'edge';

interface GooglePrediction {
  description: string;
  place_id: string;
  structured_formatting?: { main_text: string; secondary_text: string };
}

interface GooglePlaceDetails {
  result: {
    name?: string;
    formatted_address?: string;
    geometry?: { location?: { lat: number; lng: number } };
  };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const query = url.searchParams.get('q')?.trim() ?? '';

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_KEY;

  if (!apiKey) {
    const places = searchPlaces(query);
    return NextResponse.json({ places, source: 'fallback' });
  }

  try {
    const autocompleteUrl = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
    autocompleteUrl.searchParams.set('input', query);
    autocompleteUrl.searchParams.set('components', 'country:sg');
    autocompleteUrl.searchParams.set('key', apiKey);

    const acRes = await fetch(autocompleteUrl, { next: { revalidate: 300 } });
    if (!acRes.ok) throw new Error(`Places autocomplete ${acRes.status}`);
    const acData = (await acRes.json()) as { predictions?: GooglePrediction[] };
    const predictions = (acData.predictions ?? []).slice(0, 6);

    const places: Place[] = await Promise.all(
      predictions.map(async (p) => {
        const detailsUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json');
        detailsUrl.searchParams.set('place_id', p.place_id);
        detailsUrl.searchParams.set('fields', 'geometry,name,formatted_address');
        detailsUrl.searchParams.set('key', apiKey);
        const dRes = await fetch(detailsUrl, { next: { revalidate: 86400 } });
        if (!dRes.ok) throw new Error(`Place details ${dRes.status}`);
        const dData = (await dRes.json()) as GooglePlaceDetails;
        const loc = dData.result.geometry?.location;
        if (!loc) throw new Error('place has no geometry');
        return {
          label: p.structured_formatting?.main_text ?? dData.result.name ?? p.description,
          address:
            p.structured_formatting?.secondary_text ??
            dData.result.formatted_address ??
            p.description,
          coords: { lat: loc.lat, lng: loc.lng },
          placeId: p.place_id,
        };
      }),
    );

    return NextResponse.json({ places, source: 'google' });
  } catch (err) {
    console.warn('[places] Google Places failed, falling back to SG list:', err);
    const places = searchPlaces(query);
    return NextResponse.json({ places, source: 'fallback' });
  }
}
