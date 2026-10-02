import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Server-side proxy for real physical meteorological data from global weather models.
 * Queries official numerical weather prediction models (DWD ICON, NOAA GFS, ECMWF).
 * Features server-side caching and multi-model fallback to prevent free-tier rate limits (HTTP 429).
 * NO synthetic or mock data is ever generated.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('latitude')
  const lon = searchParams.get('longitude')

  if (!lat || !lon) {
    return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 })
  }

  const latStr = Number(lat).toFixed(3)
  const lonStr = Number(lon).toFixed(3)
  const params = `latitude=${latStr}&longitude=${lonStr}&hourly=temperature_2m,wind_speed_10m,wind_gusts_10m,wind_direction_10m,surface_pressure&past_days=1&forecast_days=6&timezone=UTC&wind_speed_unit=kmh`

  // 1. Primary: Best-match ensemble model (DWD / NOAA GFS blended)
  const primaryUrl = `https://api.open-meteo.com/v1/forecast?${params}`

  // 2. Secondary fallback: Official NOAA Global Forecast System (GFS 0.25°)
  const gfsUrl = `https://api.open-meteo.com/v1/gfs?${params}`

  // 3. Tertiary fallback: Official European Centre ECMWF IFS model
  const ecmwfUrl = `https://api.open-meteo.com/v1/ecmwf?${params}`

  const endpoints = [primaryUrl, gfsUrl, ecmwfUrl]

  for (const url of endpoints) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 6000)

      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ChakravatManthanPlatform/1.0 (IMD-SIH Research)',
        },
        next: { revalidate: 600 }, // Cache 10 minutes to prevent rate limits
      })
      clearTimeout(timeout)

      if (res.ok) {
        const data = await res.json()
        if (data?.hourly?.temperature_2m && data.hourly.temperature_2m.length > 0) {
          return NextResponse.json(data)
        }
      }
    } catch {
      // Endpoint busy, timeout, or rate-limited; try next real physical model
    }
  }

  // All physical models unreachable / upstream servers congested
  return NextResponse.json(
    { error: 'Upstream meteorological models are currently busy or rate-limited. Please retry shortly.' },
    { status: 503 }
  )
}
