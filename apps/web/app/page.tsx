import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { SearchForm } from '@/components/search-form';
import { RecentRoutes } from '@/components/recent-routes';
import { ThemeSwitcher } from '@/components/theme-switcher';

const OPERATORS = [
  { name: 'Grab', color: '#00B14F' },
  { name: 'Gojek', color: '#00AA13' },
  { name: 'TADA', color: '#FF3D33' },
  { name: 'Ryde', color: '#FFB800' },
  { name: 'Zig', color: '#F4364C' },
  { name: 'Geolah', color: '#1A73E8' },
  { name: 'Trans-Cab', color: '#FFC107' },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-10 pt-8 sm:max-w-2xl sm:px-8 sm:pt-14">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
            <Sparkles className="size-4 text-primary-foreground" />
          </div>
          <span className="text-base font-semibold tracking-tight">OneStopSGTaxi</span>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href="/plan"
            className="hidden rounded-full px-2.5 py-1 text-xs font-medium text-muted-foreground transition hover:text-foreground sm:inline-block"
          >
            Plan
          </Link>
          <Link
            href="/combo"
            className="hidden rounded-full px-2.5 py-1 text-xs font-medium text-muted-foreground transition hover:text-foreground sm:inline-block"
          >
            Combo
          </Link>
          <Link
            href="/split"
            className="hidden rounded-full px-2.5 py-1 text-xs font-medium text-muted-foreground transition hover:text-foreground sm:inline-block"
          >
            Split
          </Link>
          <Link
            href="/spend"
            className="rounded-full px-2.5 py-1 text-xs font-medium text-muted-foreground transition hover:text-foreground"
          >
            Spend
          </Link>
          <Link
            href="/saved"
            className="rounded-full px-2.5 py-1 text-xs font-medium text-muted-foreground transition hover:text-foreground"
          >
            Saved
          </Link>
          <ThemeSwitcher />
          <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-secondary-foreground">
            Beta
          </span>
        </div>
      </header>

      <section className="mt-10 sm:mt-16">
        <h1 className="text-balance text-3xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
          One search.
          <br />
          <span className="text-muted-foreground">Every taxi app in Singapore.</span>
        </h1>
        <p className="mt-4 max-w-prose text-pretty text-base text-muted-foreground sm:text-lg">
          Compare estimated fares and ETAs across Grab, Gojek, TADA, Ryde, Zig, Geolah and
          Trans-Cab — then tap to book in the cheapest one.
        </p>
      </section>

      <Card className="mt-8 shadow-md">
        <CardContent className="p-4 sm:p-5">
          <SearchForm />
        </CardContent>
      </Card>

      <RecentRoutes />

      <section className="mt-10">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Includes</p>
        <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {OPERATORS.map((op) => (
            <li
              key={op.name}
              className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2.5 text-sm"
            >
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: op.color }}
                aria-hidden
              />
              <span className="font-medium">{op.name}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 grid gap-4 sm:grid-cols-3">
        <Feature
          title="Save money"
          body="Surge isn't synchronized. The cheapest app right now is rarely the one you'd open first."
        />
        <Feature
          title="No new app to learn"
          body="We deeplink you straight into the operator's app — booking happens there."
        />
        <Feature
          title="No login required"
          body="Search and compare without signing in. Sign in only to save your favourite routes."
        />
      </section>

      <footer className="mt-auto pt-12 text-center text-xs text-muted-foreground">
        <p>
          Fare estimates are computed from public rate cards and route data. Final fares are
          set by the respective operator app.
        </p>
        <p className="mt-2">
          <Link href="/legal/privacy" className="underline-offset-4 hover:underline">
            Privacy
          </Link>{' '}
          ·{' '}
          <Link href="/legal/terms" className="underline-offset-4 hover:underline">
            Terms
          </Link>
        </p>
        <p className="mt-2">© {new Date().getFullYear()} OneStopSGTaxi · Singapore</p>
      </footer>
    </main>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
