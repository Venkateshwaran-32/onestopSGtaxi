import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Use — OneStopSGTaxi',
  robots: { index: true, follow: false },
};

export default function TermsPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Terms of Use</h1>
      <p className="text-xs text-muted-foreground">Last updated: 2026-05-08</p>

      <h2 className="mt-8 text-lg font-semibold">What this service is</h2>
      <p className="text-sm leading-relaxed">
        OneStopSGTaxi is an independent fare comparison tool for ride-hail services in
        Singapore. We are not affiliated with, endorsed by, or operated by Grab, Gojek,
        TADA, Ryde, Zig, ComfortDelGro, Geolah, Trans-Cab, or any other operator. All trade
        names, logos and brands referenced belong to their respective owners.
      </p>

      <h2 className="mt-8 text-lg font-semibold">Estimates only</h2>
      <p className="text-sm leading-relaxed">
        All fares and ETAs displayed are <strong>estimates</strong> computed from publicly
        available rate cards and route data. The actual fare you pay is determined by the
        operator at the time of booking and may differ — sometimes significantly — from our
        estimate due to surge, traffic, surcharges, promotions, vehicle type, or other
        factors set by the operator.
      </p>

      <h2 className="mt-8 text-lg font-semibold">No booking, no payment</h2>
      <p className="text-sm leading-relaxed">
        OneStopSGTaxi does not book rides, dispatch drivers, or process payments. When you
        tap an operator card, we open that operator&apos;s app via a standard deeplink. The
        booking, the contract of carriage, and the payment all happen between you and the
        operator under their terms.
      </p>

      <h2 className="mt-8 text-lg font-semibold">No warranty</h2>
      <p className="text-sm leading-relaxed">
        The service is provided &quot;as is&quot;. We do not warrant that estimates are
        accurate, that operators are available at any given time, or that deeplinks always
        succeed in opening the operator app. Use at your own discretion.
      </p>

      <h2 className="mt-8 text-lg font-semibold">Acceptable use</h2>
      <p className="text-sm leading-relaxed">
        Don&apos;t scrape the API, attempt to disrupt the service, or use it to harass any
        operator or driver. Reasonable use only.
      </p>
    </>
  );
}
