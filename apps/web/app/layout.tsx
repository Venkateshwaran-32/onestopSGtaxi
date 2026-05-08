import type { Metadata, Viewport } from 'next';
import { Providers } from '@/lib/providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'OneStopSGTaxi — Compare ride-hail fares in Singapore',
  description:
    'Compare fares and ETAs across Grab, Gojek, TADA, Ryde, Zig, Geolah, and Trans-Cab in one place. Find the cheapest ride, faster.',
  applicationName: 'OneStopSGTaxi',
  keywords: [
    'singapore taxi',
    'compare grab tada',
    'cheapest taxi singapore',
    'ride hailing comparison',
    'grab vs tada',
  ],
  authors: [{ name: 'OneStopSGTaxi' }],
  openGraph: {
    title: 'OneStopSGTaxi — Compare ride-hail fares in Singapore',
    description:
      'One search, all the apps. Compare Grab, TADA, Ryde, Zig, Geolah, Trans-Cab fares side-by-side.',
    type: 'website',
    locale: 'en_SG',
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'OneStopSGTaxi',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
