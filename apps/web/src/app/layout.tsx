import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, DM_Sans, Noto_Sans_Hebrew } from 'next/font/google';
import { Providers } from '@/components/providers';
import './globals.css';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-cormorant',
  display: 'swap',
  weight: ['400', '500', '600'],
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const notoHebrew = Noto_Sans_Hebrew({
  subsets: ['hebrew'],
  variable: '--font-hebrew',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

const SITE_URL = 'https://pealuna.com';
const SITE_TITLE = 'PeaLuna — Wig repair, perruques & תיקון פאות | Israel';
const SITE_DESCRIPTION =
  'PeaLuna connects you with wig repair and hair-design specialists in Israel. Réparation de perruques, soin, hair design — תיקון וטיפול בפאות.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: '%s | PeaLuna',
  },
  description: SITE_DESCRIPTION,
  applicationName: 'PeaLuna',
  keywords: [
    'PeaLuna',
    'wig repair',
    'wig care',
    'perruque',
    'réparation de perruques',
    'hair design',
    'תיקון פאות',
    'טיפול בפאות',
    'Israel',
  ],
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: 'website',
    locale: 'he_IL',
    alternateLocale: ['fr_FR', 'en_GB'],
    url: SITE_URL,
    siteName: 'PeaLuna',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'PeaLuna',
      url: SITE_URL,
      areaServed: { '@type': 'Country', name: 'Israel' },
      description: SITE_DESCRIPTION,
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'PeaLuna',
      inLanguage: ['he', 'fr', 'en'],
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${cormorant.variable} ${dmSans.variable} ${notoHebrew.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var l=localStorage.getItem('pealuna.locale');if(l==='fr'||l==='en'){document.documentElement.lang=l;document.documentElement.dir='ltr';}else{document.documentElement.lang='he';document.documentElement.dir='rtl';}}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
