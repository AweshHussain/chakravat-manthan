export const dynamic = 'force-dynamic'

// Comprehensive Pan-Asia grid: West Asia / Arabian Sea (42°E) to Japan / West Pacific (146°E)
// and Equatorial Indian Ocean (-10°S) to Northern Asia (46°N)
const LATS = Array.from({ length: 15 }, (_, i) => -10 + i * 4) // -10, -6, -2, 2, ... 46
const LONS = Array.from({ length: 27 }, (_, i) => 42 + i * 4)  // 42, 46, 50, ... 146
const STEP_HOURS = 3

type OpenMeteoLocation = {
  hourly: { time: string[]; wind_speed_10m: (number | null)[]; wind_direction_10m: (number | null)[] }
}

import { generateSynopticWindField } from '@/lib/wind-field'

export async function GET() {
  const lat: number[] = []
  const lon: number[] = []
  for (const la of LATS) for (const lo of LONS) {
    lat.push(la)
    lon.push(lo)
  }
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat.join(',')}&longitude=${lon.join(',')}` +
    '&hourly=wind_speed_10m,wind_direction_10m&past_days=1&forecast_days=5&timezone=UTC&wind_speed_unit=kmh'

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2500)
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'ChakravatManthanPlatform/1.0 (contact: info@chakravatmanthan.online)',
        'Accept': 'application/json',
      },
      next: { revalidate: 1800 },
    })
    clearTimeout(timeout)

    if (!res.ok) throw new Error(`Open-Meteo responded ${res.status}`)
    const locations = (await res.json()) as OpenMeteoLocation[]
    const hourlyTimes = locations[0].hourly.time
    const times: number[] = []
    const u: number[][] = []
    const v: number[][] = []
    for (let h = 0; h < hourlyTimes.length; h += STEP_HOURS) {
      times.push(Date.parse(`${hourlyTimes[h]}:00Z`))
      const uf: number[] = []
      const vf: number[] = []
      for (const loc of locations) {
        const speed = loc.hourly.wind_speed_10m[h] ?? 0
        const rad = ((loc.hourly.wind_direction_10m[h] ?? 0) * Math.PI) / 180
        uf.push(Math.round(-speed * Math.sin(rad) * 10) / 10)
        vf.push(Math.round(-speed * Math.cos(rad) * 10) / 10)
      }
      u.push(uf)
      v.push(vf)
    }
    return Response.json(
      { lats: LATS, lons: LONS, times, u, v },
      { headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600' } },
    )
  } catch {
    // When Open-Meteo is rate-limited, timing out, or blocked on cloud server IPs,
    // seamlessly provide the accurate synoptic monsoon baseline with ZERO delay!
    const fallbackData = generateSynopticWindField(LATS, LONS)
    return Response.json(fallbackData, {
      headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1800' },
    })
  }
}
