import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — OneStopSGTaxi',
  robots: { index: true, follow: false },
};

export default function PrivacyPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="text-xs text-muted-foreground">Last updated: 2026-05-08</p>

      <h2 className="mt-8 text-lg font-semibold">What we collect</h2>
      <p className="text-sm leading-relaxed">
        OneStopSGTaxi is a fare comparison tool. To compute fare estimates we process the
        pickup and destination addresses you enter into the search form. We use:
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
        <li>Your search inputs (pickup, destination) — kept locally on your device.</li>
        <li>
          Anonymous product analytics (PostHog) when enabled — page views and feature usage
          counts. No personal identifiers are collected unless you sign in.
        </li>
        <li>If you sign in: your email address, used solely for authentication.</li>
      </ul>

      <h2 className="mt-8 text-lg font-semibold">What we do not do</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
        <li>We do not sell your data.</li>
        <li>We do not share your data with the ride-hail operators.</li>
        <li>
          We do not see what happens after you tap a deeplink — once you&apos;re in the
          operator&apos;s app, that operator&apos;s privacy policy applies.
        </li>
      </ul>

      <h2 className="mt-8 text-lg font-semibold">Storage</h2>
      <p className="text-sm leading-relaxed">
        Saved routes and search history are stored in your browser&apos;s local storage by
        default. If you sign in, this data is synced to your account. You can clear local
        history at any time from the Saved page.
      </p>

      <h2 className="mt-8 text-lg font-semibold">Third-party services</h2>
      <p className="text-sm leading-relaxed">
        We use Mapbox or Google Maps for routing and place autocomplete, and PostHog for
        anonymous analytics. These services may receive technical request metadata (such as
        IP address) as part of standard internet operation.
      </p>

      <h2 className="mt-8 text-lg font-semibold">Contact</h2>
      <p className="text-sm leading-relaxed">
        Questions? Reach out via the contact email on the homepage footer.
      </p>
    </>
  );
}
