import { NextResponse } from 'next/server';
import { z } from 'zod';
import { hourBucketOf, hourOfWeek, makeRouteKey } from '@onestopsgtaxi/shared';

export const runtime = 'edge';

const SubmitSchema = z.object({
  operatorId: z.enum([
    'grab',
    'gojek',
    'tada',
    'ryde',
    'zig',
    'geolah',
    'transcab',
    'cdg',
  ]),
  pickupLabel: z.string().min(1),
  dropoffLabel: z.string().min(1),
  distanceKm: z.number().positive().max(120),
  estimatedFareSGD: z.number().positive().max(500),
  actualFareSGD: z.number().positive().max(500),
  source: z.enum(['manual', 'ocr', 'email']),
  submittedAtClient: z.string().datetime().optional(),
});

interface SupabaseInsertResp {
  id: string;
}

async function persistToSupabase(
  payload: ReturnType<typeof SubmitSchema.parse>,
): Promise<SupabaseInsertResp | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRole) return null;

  const now = new Date();
  const row = {
    operator_id: payload.operatorId,
    route_key: makeRouteKey(payload.pickupLabel, payload.dropoffLabel),
    pickup_label: payload.pickupLabel,
    dropoff_label: payload.dropoffLabel,
    distance_km: payload.distanceKm,
    estimated_fare_sgd: payload.estimatedFareSGD,
    actual_fare_sgd: payload.actualFareSGD,
    source: payload.source,
    hour_of_week: hourOfWeek(now),
    hour_bucket: hourBucketOf(hourOfWeek(now)),
    submitted_at: payload.submittedAtClient ?? now.toISOString(),
  };

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/fare_submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceRole,
        Authorization: `Bearer ${serviceRole}`,
        Prefer: 'return=representation',
      },
      body: JSON.stringify(row),
    });
    if (!res.ok) {
      console.warn('[calibrate] supabase insert failed:', res.status);
      return null;
    }
    const json = (await res.json()) as Array<{ id: string }>;
    return json[0] ? { id: json[0].id } : null;
  } catch (err) {
    console.warn('[calibrate] supabase fetch threw:', err);
    return null;
  }
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid json' }, { status: 400 });
  }

  const parsed = SubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'validation_failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const ratio = parsed.data.actualFareSGD / parsed.data.estimatedFareSGD;
  if (ratio < 0.3 || ratio > 4) {
    return NextResponse.json(
      {
        ok: false,
        error: 'plausibility_check_failed',
        hint: 'Actual fare is way off the estimate; double-check the number.',
      },
      { status: 400 },
    );
  }

  const stored = await persistToSupabase(parsed.data);

  return NextResponse.json({
    ok: true,
    stored: stored !== null,
    submissionId: stored?.id ?? null,
    serverMode: stored ? 'supabase' : 'client_only',
  });
}

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return NextResponse.json({
    ok: true,
    serverMode: supabaseUrl && serviceRole ? 'supabase' : 'client_only',
    notes: [
      'POST {operatorId, pickupLabel, dropoffLabel, distanceKm, estimatedFareSGD, actualFareSGD, source}',
      'Source field is one of: manual | ocr | email',
      'When SUPABASE_SERVICE_ROLE_KEY is set, submissions persist server-side.',
      'Otherwise they live only in the user\'s localStorage and calibrate that user only.',
      'Migration SQL: docs/migrations/0001_crowd_calibration.sql',
    ],
  });
}
