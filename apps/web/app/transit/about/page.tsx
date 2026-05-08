import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Bus,
  CheckCircle2,
  Clock,
  Footprints,
  Hash,
  MapPin,
  Sparkles,
  Train,
  XCircle,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ThemeSwitcher } from '@/components/theme-switcher';

export const metadata: Metadata = {
  title: 'How the transit hopper works — OneStopSGTaxi',
  description:
    'Faster than the next direct bus. Looks at live LTA bus arrivals, pairs them with transfer windows, and finds combinations Google Maps cannot. Built for Singapore commuters.',
  keywords: [
    'singapore bus arrival',
    'fastest bus route',
    'lta datamall',
    'live bus timing singapore',
    'bus transfer planner',
    'sg bus app',
  ],
  openGraph: {
    title: 'Faster than the next direct bus — Transit hopper',
    description:
      'Live-arrival aware bus + MRT planning. The trick SG commuters do in their heads, automated.',
  },
  alternates: {
    canonical: '/transit/about',
  },
};

export default function TransitAboutPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-5 pb-12 pt-4 sm:px-8 sm:pt-8">
      <header className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/transit" aria-label="Back to transit">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="flex-1 text-base font-semibold">How transit hopper works</h1>
        <ThemeSwitcher />
      </header>

      {/* HERO */}
      <section className="mt-8 sm:mt-12">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
          For Singapore commuters
        </p>
        <h2 className="mt-3 text-balance text-3xl font-semibold leading-[1.1] tracking-tight sm:text-4xl">
          Faster than the next
          <br />
          <span className="text-muted-foreground">direct bus.</span>
        </h2>
        <p className="mt-4 max-w-prose text-pretty text-base text-muted-foreground sm:text-lg">
          A typical Google Maps trip plan picks the route by static schedules. But the next
          direct bus is often 12 minutes away when a 2-min bus + a 2-min connecting bus
          would have you there 10 minutes sooner. <strong>That math is what we automate.</strong>
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild size="lg" className="gap-2">
            <Link href="/transit">
              <Sparkles className="size-4" />
              Try it now
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href="https://datamall.lta.gov.sg/" target="_blank" rel="noopener noreferrer">
              Get an LTA key
            </a>
          </Button>
        </div>
      </section>

      {/* THE PAIN */}
      <section className="mt-14">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">§ 01 — The pain</p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight">
          Every SG commuter does this trick in their head.
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
          You&apos;re at Depot Road. You want to go to West Coast Park. The direct bus
          frequency is 10–15 min. Right now next direct is 12 min away. But you notice
          another bus is in 2 min, going via a different stop where another bus is also in
          2 min — total trip time about 10 minutes shorter.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
          You&apos;re doing real-time route optimization in your head, against partial
          information shown across two apps and a screwed-up bus stop board. We do it for
          you.
        </p>
      </section>

      {/* WORKED EXAMPLE */}
      <section className="mt-12">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">§ 02 — Worked example</p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight">
          Depot Road → West Coast Park.
        </h3>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Card className="border-amber-200 bg-amber-50/40 p-4 dark:border-amber-900 dark:bg-amber-950/20">
            <p className="text-[10px] font-medium uppercase tracking-wider text-amber-900 dark:text-amber-200">
              Direct option
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Bus className="size-5 text-amber-700 dark:text-amber-300" />
              <span className="text-base font-semibold">Bus 195</span>
              <span className="text-xs text-muted-foreground">direct</span>
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums">~30 min</p>
            <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
              <li className="flex items-center gap-2">
                <Clock className="size-3" />
                Wait 12 min for next 195
              </li>
              <li className="flex items-center gap-2">
                <Bus className="size-3" />
                Ride 18 min through 4 stops
              </li>
            </ul>
          </Card>

          <Card className="border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
            <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-900 dark:text-emerald-200">
              Transit hopper picks
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Bus className="size-5 text-emerald-700 dark:text-emerald-300" />
              <span className="text-base font-semibold">51 → 111</span>
              <span className="text-xs text-muted-foreground">transfer at Buona Vista</span>
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums">~18 min</p>
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
              Save 12 min · about 40% faster
            </p>
            <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
              <li className="flex items-center gap-2">
                <Clock className="size-3" />
                Wait 2 min for next 51
              </li>
              <li className="flex items-center gap-2">
                <Bus className="size-3" />
                Ride 6 min to Buona Vista
              </li>
              <li className="flex items-center gap-2">
                <Clock className="size-3" />
                Wait 2 min for 111 (timed!)
              </li>
              <li className="flex items-center gap-2">
                <Bus className="size-3" />
                Ride 8 min to West Coast Park
              </li>
            </ul>
          </Card>
        </div>

        <p className="mt-4 text-[11px] text-muted-foreground">
          Numbers shown are illustrative — your actual numbers come from LTA DataMall&apos;s live
          BusArrivalv2 feed. The point is the optimization, not the specific minute.
        </p>
      </section>

      {/* HOW IT WORKS */}
      <section className="mt-14">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">§ 03 — How</p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight">
          Four passes, every time you search.
        </h3>

        <ol className="mt-6 space-y-3">
          <Step
            n={1}
            title="Resolve your endpoints"
            body="Address autocomplete (Google Places quality) or a 5-digit bus stop code if you know it. We pick the top 3 stops within 400 m of each end as candidates."
            icon={MapPin}
          />
          <Step
            n={2}
            title="Generate candidate plans"
            body="Direct: services that touch both your origin and destination stops, in the right direction. 1-transfer: services from origin that share a stop with services to destination. MRT-mixed: when a quick MRT segment beats both."
            icon={Bus}
          />
          <Step
            n={3}
            title="Score against live arrivals"
            body="For every candidate, fetch the live BusArrivalv2 feed (LTA DataMall) at every stop in the plan. For transfers, we match: arr_at_X = wait_for_first_bus + ride_time. We then pick the next bus at X arriving after we'd be there."
            icon={Zap}
          />
          <Step
            n={4}
            title="Rank and return top 6"
            body="Total minutes wins. Direct vs 1-transfer vs MRT-mixed all compete on the same time axis. The 'live' badge on each leg shows where we used real arrivals vs headway estimates."
            icon={CheckCircle2}
          />
        </ol>
      </section>

      {/* WHY GMAPS DOESN'T */}
      <section className="mt-14">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">§ 04 — vs Google Maps</p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight">
          Why Maps misses this.
        </h3>

        <Card className="mt-5 overflow-hidden">
          <CardContent className="p-0">
            <div className="grid grid-cols-2 divide-x text-sm">
              <div className="space-y-2 p-4">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Google Maps
                </p>
                <Row icon={XCircle} text="Plans against static GTFS schedules" muted />
                <Row icon={XCircle} text="Treats &lsquo;next 195 in 12 min&rsquo; as your starting point" muted />
                <Row icon={XCircle} text="Doesn&apos;t time-match transfers against live arrivals" muted />
                <Row icon={XCircle} text="One algorithm for the whole world" muted />
              </div>
              <div className="space-y-2 bg-emerald-50/30 p-4 dark:bg-emerald-950/20">
                <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  Transit hopper
                </p>
                <Row icon={CheckCircle2} text="Live BusArrivalv2 every search" />
                <Row icon={CheckCircle2} text="Sees the 51 in 2 min that you&apos;d otherwise miss" />
                <Row icon={CheckCircle2} text="Matches transfer arrival to leg-1 ride time" />
                <Row icon={CheckCircle2} text="Singapore-tuned, won&apos;t scale to KL or Tokyo" />
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="mt-3 text-xs text-muted-foreground">
          Singapore-tuned is a feature, not a bug. We can be opinionated about MRT lines,
          peak-hour patterns, and the specific shape of LTA&apos;s data — Google has to be
          generic.
        </p>
      </section>

      {/* DATA */}
      <section className="mt-14">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">§ 05 — Data</p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight">
          We use LTA DataMall — free, open.
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Singapore&apos;s Land Transport Authority publishes a public data API:
          <a
            href="https://datamall.lta.gov.sg/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-4 hover:underline"
          >
            {' '}datamall.lta.gov.sg
          </a>
          . Three endpoints power the planner.
        </p>

        <ul className="mt-4 space-y-2 text-sm">
          <DataRow
            label="BusStops, BusServices, BusRoutes"
            kind="static"
            note="All ~5,200 stops, ~400 services, ~50,000 route entries. Fetched once via `pnpm topology:fetch`, cached in the repo."
          />
          <DataRow
            label="BusArrivalv2"
            kind="live"
            note="Per-stop next-3-buses with EstimatedArrival timestamp + crowdedness. Called fresh every search; cached 18 s."
          />
        </ul>

        <p className="mt-4 text-xs text-muted-foreground">
          You provide an LTA AccountKey via <code className="rounded bg-muted px-1 py-0.5">LTA_DATAMALL_KEY</code>{' '}
          env var. Free signup, ~5 min including waiting for the email.
        </p>
      </section>

      {/* CURRENT STATE */}
      <section className="mt-14">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">§ 06 — Current limits</p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight">
          What V1 does and doesn&apos;t do.
        </h3>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Card className="p-4">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <CheckCircle2 className="size-4 text-emerald-600" /> V1 ships with
            </p>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              <li>Direct + 1-transfer bus plans</li>
              <li>MRT-mixed plans (walk to MRT, ride, walk to dest)</li>
              <li>Live LTA BusArrivalv2 integration</li>
              <li>Address or 5-digit stop-code input</li>
              <li>Crowdedness hint per leg</li>
              <li>Headway-based fallback when no key set</li>
            </ul>
          </Card>
          <Card className="p-4">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="size-4 text-amber-600" /> V1.1 deferred
            </p>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              <li>2+ transfers (1-transfer max for now)</li>
              <li>Walking up to 400 m between stops</li>
              <li>Pin a hop, push when it improves</li>
              <li>Saved transit routes alongside saved taxi routes</li>
              <li>Bus crowdedness in the ranking</li>
              <li>LTA station-accessibility filters</li>
            </ul>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="mt-14">
        <Card className="border-primary/30 bg-primary/5 p-6 text-center">
          <h3 className="text-xl font-semibold tracking-tight">Try a hop right now.</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Address autocomplete or stop code. With or without an LTA key — the page works
            either way.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="gap-2">
              <Link href="/transit">
                <Sparkles className="size-4" />
                Plan my hop
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link href="/">
                <ArrowRight className="size-4" />
                Back to taxi compare
              </Link>
            </Button>
          </div>
        </Card>
      </section>

      <footer className="mt-12 border-t pt-6 text-center text-[11px] text-muted-foreground">
        <p>
          Bus arrival data via{' '}
          <a
            href="https://datamall.lta.gov.sg/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-4 hover:underline"
          >
            LTA DataMall
          </a>
          . MRT timing uses static headways; live MRT arrivals are not publicly available.
        </p>
        <p className="mt-2">
          Built in Singapore, for Singapore. Part of{' '}
          <Link href="/" className="underline-offset-4 hover:underline">
            OneStopSGTaxi
          </Link>
          .
        </p>
      </footer>
    </main>
  );
}

function Step({
  n,
  title,
  body,
  icon: Icon,
}: {
  n: number;
  title: string;
  body: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <li className="flex gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Icon className="size-4" />
      </span>
      <div className="flex-1 rounded-xl border bg-card p-3">
        <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
          Step 0{n}
        </p>
        <p className="mt-0.5 text-sm font-semibold">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </li>
  );
}

function Row({
  icon: Icon,
  text,
  muted,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <p className={'flex items-start gap-2 ' + (muted ? 'text-muted-foreground' : '')}>
      <Icon className={'mt-0.5 size-4 shrink-0 ' + (muted ? 'text-muted-foreground' : 'text-emerald-600')} />
      <span>{text}</span>
    </p>
  );
}

function DataRow({
  label,
  kind,
  note,
}: {
  label: string;
  kind: 'static' | 'live';
  note: string;
}) {
  return (
    <li className="flex items-start gap-3 rounded-lg border bg-card p-3">
      <span
        className={
          'mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ' +
          (kind === 'live'
            ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200'
            : 'bg-secondary text-foreground')
        }
      >
        {kind === 'live' ? <Zap className="size-2.5" /> : <Hash className="size-2.5" />}
        {kind}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{note}</p>
      </div>
    </li>
  );
}
