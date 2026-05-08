import { NextResponse } from 'next/server';
import { z } from 'zod';

const FeedbackSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  worked: z.string().max(2000).optional(),
  brokeOrConfused: z.string().max(2000).optional(),
  contact: z.string().max(200).optional(),
  pageContext: z.string().max(200).optional(),
  userAgent: z.string().max(400).optional(),
});

interface SupabaseRow {
  id: string;
}

async function persistToSupabase(
  payload: ReturnType<typeof FeedbackSchema.parse>,
): Promise<SupabaseRow | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRole) return null;

  const row = {
    rating: payload.rating ?? null,
    worked: payload.worked ?? null,
    broke_or_confused: payload.brokeOrConfused ?? null,
    contact: payload.contact ?? null,
    page_context: payload.pageContext ?? null,
    user_agent: payload.userAgent ?? null,
    submitted_at: new Date().toISOString(),
  };

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/feedback`, {
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
      console.warn('[feedback] supabase insert failed:', res.status);
      return null;
    }
    const json = (await res.json()) as Array<{ id: string }>;
    return json[0] ? { id: json[0].id } : null;
  } catch (err) {
    console.warn('[feedback] supabase fetch threw:', err);
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
  const parsed = FeedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'validation_failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (
    !parsed.data.rating &&
    !parsed.data.worked?.trim() &&
    !parsed.data.brokeOrConfused?.trim()
  ) {
    return NextResponse.json(
      { ok: false, error: 'empty_feedback' },
      { status: 400 },
    );
  }

  const stored = await persistToSupabase(parsed.data);

  return NextResponse.json({
    ok: true,
    stored: stored !== null,
    feedbackId: stored?.id ?? null,
    serverMode: stored ? 'supabase' : 'client_only',
  });
}

export async function GET() {
  const hasSupabase =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  return NextResponse.json({
    ok: true,
    serverMode: hasSupabase ? 'supabase' : 'client_only',
    note: hasSupabase
      ? null
      : 'Feedback is stored client-side only until Supabase is wired. Run docs/migrations/0002_feedback.sql.',
  });
}
