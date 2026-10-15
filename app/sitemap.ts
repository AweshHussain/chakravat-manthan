import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://chakravatmanthan.adeebrazi.online',
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1.0,
    },
  ]
}
