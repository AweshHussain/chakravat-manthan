import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://chakravatmanthan.adeebrazi.online'),
  title: 'Chakravat Manthan | AI-Powered Cyclone Detection',
  description:
    'Chakravat Manthan is an AI-powered platform for tropical cyclone detection and intensity classification using satellite imagery and deep learning.',
  applicationName: 'Chakravat Manthan',
  authors: [{ name: 'Cybernetic Crusaders' }],
  creator: 'Cybernetic Crusaders',
  publisher: 'Cybernetic Crusaders',
  keywords: [
    'Chakravat Manthan',
    'AI-powered cyclone detection',
    'cyclone classification using satellite imagery',
    'tropical cyclone detection',
    'cyclone classification',
    'INSAT-3DR satellite imagery',
    'ISRO MOSDAC',
    'deep learning cyclone detection',
    'North Indian Ocean cyclones',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Chakravat Manthan | AI-Powered Cyclone Detection',
    description:
      'AI-powered platform for tropical cyclone detection and intensity classification using satellite imagery and deep learning.',
    url: 'https://chakravatmanthan.adeebrazi.online',
    siteName: 'Chakravat Manthan',
    images: [
      {
        url: '/logo.png',
        width: 512,
        height: 512,
        alt: 'Chakravat Manthan Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chakravat Manthan | AI-Powered Cyclone Detection',
    description:
      'AI-powered platform for tropical cyclone detection and intensity classification using satellite imagery and deep learning.',
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      {
        url: '/favicon.ico',
        sizes: 'any',
      },
      {
        url: '/logo.png',
        type: 'image/png',
      },
    ],
    apple: '/logo.png',
  },
  verification: {
    google: 'wsFHUMkJMDCysc8KVZ1KWJ4-IpZE32NNnWT8ItXQ3u8',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#020617',
  width: 'device-width',
  initialScale: 1,
}

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://chakravatmanthan.adeebrazi.online/#website',
      url: 'https://chakravatmanthan.adeebrazi.online',
      name: 'Chakravat Manthan',
      description:
        'AI-powered tropical cyclone detection and intensity classification platform using satellite imagery and deep learning.',
      inLanguage: 'en-US',
      publisher: {
        '@type': 'Organization',
        name: 'Cybernetic Crusaders',
        url: 'https://chakravatmanthan.adeebrazi.online',
      },
    },
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://chakravatmanthan.adeebrazi.online/#application',
      name: 'Chakravat Manthan',
      applicationCategory: 'WeatherApplication',
      operatingSystem: 'Web Browser',
      url: 'https://chakravatmanthan.adeebrazi.online',
      description:
        'Interactive meteorological web platform for tropical cyclone detection and intensity classification using satellite imagery.',
      author: {
        '@type': 'Organization',
        name: 'Cybernetic Crusaders',
      },
    },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark bg-slate-950">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
