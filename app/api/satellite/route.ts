const LAYER = 'Himawari_AHI_Band13_Clean_Infrared'
const TEN_MIN = 10 * 60 * 1000
const FRAME_COUNT = 18

const probeUrl = (iso: string) =>
  `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${LAYER}/default/${iso}/GoogleMapsCompatible_Level6/3/3/5.png`

const toIso = (ms: number) => new Date(ms).toISOString().replace('.000Z', 'Z')

export async function GET() {
  const start = Math.floor(Date.now() / TEN_MIN) * TEN_MIN
  const candidates = Array.from({ length: 24 }, (_, i) => start - (i + 2) * TEN_MIN)

  const results = await Promise.all(
    candidates.map(async (ms) => {
      try {
        const res = await fetch(probeUrl(toIso(ms)), { method: 'HEAD', next: { revalidate: 300 } })
        return res.ok ? ms : null
      } catch {
        return null
      }
    }),
  )
  const latest = results.find((ms): ms is number => ms !== null) ?? start - 2 * 60 * 60 * 1000
  const frames = Array.from({ length: FRAME_COUNT }, (_, i) => latest - (FRAME_COUNT - 1 - i) * TEN_MIN)

  return Response.json(
    { layer: LAYER, latest, frames },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } },
  )
}
