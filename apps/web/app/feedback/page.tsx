'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Loader2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { track } from '@/lib/analytics';

const RATINGS = [1, 2, 3, 4, 5] as const;

export default function FeedbackPage() {
  const [rating, setRating] = React.useState<number | null>(null);
  const [worked, setWorked] = React.useState('');
  const [broken, setBroken] = React.useState('');
  const [contact, setContact] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating == null && !worked.trim() && !broken.trim()) {
      setError('Please rate, share what worked, or share what broke.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: rating ?? undefined,
          worked: worked || undefined,
          brokeOrConfused: broken || undefined,
          contact: contact || undefined,
          pageContext: typeof document !== 'undefined' ? document.referrer : undefined,
          userAgent:
            typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 400) : undefined,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `Server returned ${res.status}`);
      }
      track('feedback_submitted', {
        rating: rating ?? null,
        has_worked: !!worked.trim(),
        has_broken: !!broken.trim(),
        has_contact: !!contact.trim(),
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-10 pt-4 sm:px-8 sm:pt-8">
        <header className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/" aria-label="Back to home">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <h1 className="flex-1 text-base font-semibold">Feedback</h1>
        </header>
        <section className="mt-12 flex flex-1 flex-col items-center justify-center text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200">
            <Check className="size-7" />
          </div>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight">Thanks.</h2>
          <p className="mt-2 max-w-prose text-sm text-muted-foreground">
            That goes straight to the founder. Good chance you&apos;ll hear back if you left a
            contact.
          </p>
          <Button asChild className="mt-6">
            <Link href="/">Back to the app</Link>
          </Button>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-10 pt-4 sm:max-w-2xl sm:px-8 sm:pt-8">
      <header className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/" aria-label="Back to home">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="flex-1 text-base font-semibold">Feedback</h1>
        <ThemeSwitcher />
      </header>

      <section className="mt-6">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-5 text-primary" />
          <h2 className="text-2xl font-semibold tracking-tight">Tell me what&apos;s broken.</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          You&apos;re a beta tester. Anything from &ldquo;the home page hung for 4s on my Pixel&rdquo; to
          &ldquo;the bus thing actually saved me 8 min today&rdquo; is welcome.
        </p>
      </section>

      <Card className="mt-6">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Quick rating
              </p>
              <div className="flex gap-1.5">
                {RATINGS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    className={
                      'flex size-10 items-center justify-center rounded-md border text-sm font-semibold transition ' +
                      (rating === n
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card hover:bg-secondary')
                    }
                  >
                    {n}
                  </button>
                ))}
                <span className="ml-2 self-center text-[11px] text-muted-foreground">
                  1 broke / 5 great
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                What worked
              </label>
              <textarea
                value={worked}
                onChange={(e) => setWorked(e.target.value)}
                rows={3}
                placeholder="The bus thing saved me 8 min on the Tampines run."
                className="mt-1.5 w-full resize-y rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                What broke or confused you
              </label>
              <textarea
                value={broken}
                onChange={(e) => setBroken(e.target.value)}
                rows={3}
                placeholder="iPhone 12 Safari, /compare hung for ~5s after I tapped Compare."
                className="mt-1.5 w-full resize-y rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Contact (optional)
              </label>
              <Input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Email, Telegram, IG handle — anything reachable"
                className="mt-1.5"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Only used if I want to follow up on a bug. Never marketing.
              </p>
            </div>

            {error && (
              <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Sending…
                </>
              ) : (
                'Submit feedback'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="mt-auto pt-12 text-center text-[11px] text-muted-foreground">
        Stored on the server when Supabase is configured, otherwise just acknowledged. Either
        way, no PII is logged unless you put it in the contact field.
      </p>
    </main>
  );
}
