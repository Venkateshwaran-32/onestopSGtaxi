import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://onestopsgtaxi.com';
  const now = new Date();
  return [
    { url: `${baseUrl}/`, lastModified: now, priority: 1.0 },
    { url: `${baseUrl}/split`, lastModified: now, priority: 0.6 },
    { url: `${baseUrl}/saved`, lastModified: now, priority: 0.4 },
    { url: `${baseUrl}/spend`, lastModified: now, priority: 0.4 },
    { url: `${baseUrl}/legal/privacy`, lastModified: now, priority: 0.2 },
    { url: `${baseUrl}/legal/terms`, lastModified: now, priority: 0.2 },
  ];
}
