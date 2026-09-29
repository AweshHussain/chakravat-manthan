const LAYER = 'Himawari_AHI_Band13_Clean_Infrared'
const TEN_MIN = 10 * 60 * 1000
const FRAME_COUNT = 18

const probeUrl = (iso: string) =>
  `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${LAYER}/default/${iso}/GoogleMapsCompatible_Level6/3/3/5.png`

const toIso = (ms: number) => new Date(ms).toISOString().replace('.000Z', 'Z')

export async function GET() {
  const start = Math.floor(Date.now() / TEN_MIN) * TEN_MIN
  // Probe candidates with a short timeout; usually the pass from ~40-60 min ago is available
  const candidates = [start - 4 * TEN_MIN, start - 6 * TEN_MIN, start - 8 * TEN_MIN, start - 10 * TEN_MIN]

  let latest: number | null = null
  for (const ms of candidates) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 800)
      const res = await fetch(probeUrl(toIso(ms)), {
        method: 'HEAD',
        signal: controller.signal,
        next: { revalidate: 600 },
      })
      clearTimeout(timeout)
      if (res.ok) {
        latest = ms
        break
      }
    } catch {
      // Continue to next candidate
    }
  }

  if (!latest) {
    latest = start - 6 * TEN_MIN
  }
  const frames = Array.from({ length: FRAME_COUNT }, (_, i) => latest! - (FRAME_COUNT - 1 - i) * TEN_MIN)

  return Response.json(
    { layer: LAYER, latest, frames },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } },
  )
}
