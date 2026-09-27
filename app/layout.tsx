import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Chakravat Manthan — Operational Tropical Cyclone & Satellite Platform',
  description:
    'Operational satellite data integration, INSAT-3DR TIR-1 infrared sequence processing, and PyTorch deep neural network cyclone analytics over India, Bay of Bengal and Arabian Sea.',
  applicationName: 'Chakravat Manthan',
  authors: [{ name: 'Chakravat Manthan AI Team' }],
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#020617',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark bg-slate-950">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
