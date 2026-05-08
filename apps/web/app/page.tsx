import { ArrowRight, MapPin, MoveDown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

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
        <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-secondary-foreground">
          Beta
        </span>
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
        <CardContent className="space-y-3 p-4 sm:p-5">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Pickup location"
              className="pl-10"
              aria-label="Pickup location"
              disabled
            />
          </div>
          <div className="flex justify-center">
            <MoveDown className="size-4 text-muted-foreground" />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Where to?"
              className="pl-10"
              aria-label="Destination"
              disabled
            />
          </div>
          <Button size="lg" className="w-full" disabled>
            Compare prices
            <ArrowRight className="size-4" />
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Comparison coming next week — we&apos;re wiring up the operators.
          </p>
        </CardContent>
      </Card>

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
