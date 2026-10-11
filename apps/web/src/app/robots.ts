import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/pro', '/admin', '/verify-email', '/api'],
      },
    ],
    sitemap: 'https://pealuna.com/sitemap.xml',
    host: 'https://pealuna.com',
  };
}
