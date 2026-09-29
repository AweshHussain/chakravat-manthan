import { HOUR, floorTo } from './time'

export type ImdCategory = {
  code: string
  name: string
  minKt: number
  color: string
}

export const IMD_CATEGORIES: ImdCategory[] = [
  { code: 'FAIR', name: 'Fair Weather / Normal Basin', minKt: 0, color: '#34d399' },
  { code: 'TD', name: 'Tropical Depression', minKt: 12, color: '#38bdf8' },
  { code: 'D', name: 'Depression', minKt: 17, color: '#67e8f9' },
  { code: 'DD', name: 'Deep Depression', minKt: 28, color: '#22d3ee' },
  { code: 'CS', name: 'Cyclonic Storm', minKt: 34, color: '#a3e635' },
  { code: 'SCS', name: 'Severe Cyclonic Storm', minKt: 48, color: '#facc15' },
  { code: 'VSCS', name: 'Very Severe Cyclonic Storm', minKt: 64, color: '#fb923c' },
  { code: 'ESCS', name: 'Extremely Severe Cyclonic Storm', minKt: 90, color: '#f87171' },
  { code: 'SuCS', name: 'Super Cyclonic Storm', minKt: 120, color: '#e879f9' },
]

export function categoryFor(windKt: number): ImdCategory {
  let result = IMD_CATEGORIES[0]
  for (const cat of IMD_CATEGORIES) if (windKt >= cat.minKt) result = cat
  return result
}

const CLASS_CENTERS = [22.5, 30.5, 41, 56, 77, 105, 132]

/** Mirrors the softmax output of the CNN-GRU stage classifier for a given intensity estimate. */
export function stageProbabilities(windKt: number) {
  const sigma = 11
  const raw = CLASS_CENTERS.map((c) => Math.exp(-(((windKt - c) / sigma) ** 2)) + 0.004)
  const total = raw.reduce((a, b) => a + b, 0)
  return IMD_CATEGORIES.map((cat, i) => ({ code: cat.code, color: cat.color, p: raw[i] / total }))
}

export function pressureFromWind(windKt: number) {
  return Math.round(1008 - 0.36 * windKt - 0.0024 * windKt * windKt)
}

export type TrackPoint = { lat: number; lon: number; windKt: number; t?: number }

export type ArchiveCyclone = {
  id: string
  name: string
  year: number
  basin: 'Bay of Bengal' | 'Arabian Sea'
  peakWindKt: number
  minPressure: number
  landfall: string
  durationHours: number
  startDate: string
  track: TrackPoint[]
}

const tp = (lat: number, lon: number, windKt: number, hourOffset = 0): TrackPoint => ({ lat, lon, windKt, t: hourOffset })

export const ARCHIVE_CYCLONES: ArchiveCyclone[] = [
  {
    id: 'amphan-2020',
    name: 'Amphan',
    year: 2020,
    basin: 'Bay of Bengal',
    peakWindKt: 130,
    minPressure: 920,
    landfall: 'Digha–Hatiya, West Bengal · 20 May',
    durationHours: 96,
    startDate: '16 May 2020, 00:00 UTC',
    track: [
      tp(9.5, 87.5, 20, 0),      // 16 May 00:00 UTC (Depression genesis)
      tp(9.8, 86.4, 25, 12),     // 16 May 12:00 UTC (Deep Depression)
      tp(11.2, 86.1, 45, 24),    // 17 May 00:00 UTC (Cyclonic Storm Amphan named)
      tp(13.7, 86.2, 120, 48),   // 18 May 00:00 UTC (Extremely Severe)
      tp(14.8, 86.5, 130, 56),   // 18 May 08:00 UTC (Super Cyclone peak 130 kt)
      tp(16.0, 86.9, 120, 68),   // 18 May 20:00 UTC (Maintaining extreme intensity)
      tp(17.4, 87.0, 105, 76),   // 19 May 04:00 UTC (Approaching north bay)
      tp(18.7, 87.3, 100, 84),   // 19 May 12:00 UTC (Turning north-northeast)
      tp(20.6, 88.0, 90, 90),    // 20 May 06:00 UTC (Coast crossing near Digha)
      tp(22.8, 88.6, 65, 96),    // 20 May 12:00 UTC (Landfall decay over West Bengal)
    ],
  },
  {
    id: 'kyarr-2019',
    name: 'Kyarr',
    year: 2019,
    basin: 'Arabian Sea',
    peakWindKt: 130,
    minPressure: 922,
    landfall: 'Open Arabian Sea Super Cyclone · Record Intensity',
    durationHours: 96,
    startDate: '24 Oct 2019, 06:00 UTC',
    track: [
      tp(15.1, 67.2, 20, 0),
      tp(17.2, 67.4, 125, 24),
      tp(18.2, 65.1, 125, 48),
      tp(19.1, 63.5, 120, 60),
      tp(19.6, 62.9, 100, 72),
      tp(18.9, 61.4, 65, 80),
      tp(17.7, 60.0, 40, 88),
      tp(16.2, 59.0, 25, 92),
      tp(14.0, 56.6, 25, 96),
    ],
  },
  {
    id: 'fani-2019',
    name: 'Fani',
    year: 2019,
    basin: 'Bay of Bengal',
    peakWindKt: 115,
    minPressure: 932,
    landfall: 'Puri, Odisha · 3 May',
    durationHours: 96,
    startDate: '26 Apr 2019, 00:00 UTC',
    track: [
      tp(1.9, 90.2, 25, 0),
      tp(3.5, 89.7, 25, 12),
      tp(6.0, 89.2, 45, 24),
      tp(8.0, 87.6, 45, 36),
      tp(10.5, 86.9, 55, 48),
      tp(13.4, 84.6, 95, 60),
      tp(14.8, 84.2, 100, 72),
      tp(16.8, 84.8, 110, 84),
      tp(19.6, 85.7, 100, 96),
    ],
  },
  {
    id: 'tauktae-2021',
    name: 'Tauktae',
    year: 2021,
    basin: 'Arabian Sea',
    peakWindKt: 100,
    minPressure: 950,
    landfall: 'Diu / Saurashtra Coast, Gujarat · 17 May',
    durationHours: 84,
    startDate: '14 May 2021, 00:00 UTC',
    track: [
      tp(11.2, 72.5, 25, 0),
      tp(12.8, 72.4, 45, 12),
      tp(14.6, 72.6, 75, 24),
      tp(16.5, 72.2, 95, 36),
      tp(18.5, 71.5, 100, 48),
      tp(20.8, 71.1, 100, 60),
      tp(22.5, 71.5, 50, 72),
      tp(24.0, 72.8, 25, 84),
    ],
  },
]

/**
 * Interpolates archive cyclone state along its historical lifecycle from progress (0.0 to 1.0).
 */
export function interpolateArchiveProgress(cyclone: ArchiveCyclone, progress: number): CycloneState & { progressHours: number; phaseName: string } {
  const pts = cyclone.track
  const maxH = cyclone.durationHours || pts[pts.length - 1].t || 96
  const currentH = Math.max(0, Math.min(maxH, progress * maxH))

  let i = 0
  while (i < pts.length - 2 && (pts[i + 1].t ?? (i + 1) * 12) < currentH) {
    i++
  }
  const a = pts[i]
  const b = pts[i + 1]
  const at = a.t ?? i * 12
  const bt = b.t ?? (i + 1) * 12
  const f = bt === at ? 0 : Math.max(0, Math.min(1, (currentH - at) / (bt - at)))

  const lat = a.lat + (b.lat - a.lat) * f
  const lon = a.lon + (b.lon - a.lon) * f
  const windKt = Math.round(a.windKt + (b.windKt - a.windKt) * f)
  const dy = (b.lat - a.lat) * 111
  const dx = (b.lon - a.lon) * 111 * Math.cos((lat * Math.PI) / 180)
  const headingDeg = (Math.atan2(dx, dy) * 180) / Math.PI + (dx < 0 ? 360 : 0)
  const speedKmh = Math.max(12, Math.hypot(dx, dy) / Math.max(1, (bt - at)))

  let phaseName = 'Genesis / Depression'
  if (currentH >= maxH * 0.9) phaseName = 'Landfall & Dissipation'
  else if (windKt >= 120) phaseName = 'Peak Super Cyclonic Storm'
  else if (windKt >= 64) phaseName = 'Intensification / Severe Storm'
  else if (windKt >= 34) phaseName = 'Cyclonic Storm Development'

  return {
    lat,
    lon,
    windKt,
    pressure: pressureFromWind(windKt),
    headingDeg,
    speedKmh,
    progressHours: Math.round(currentH),
    phaseName,
  }
}

/** Real-world synoptic trajectory: Genesis from Gulf of Thailand / southern Myanmar coast (16.4°N, 97.3°E) into the Andaman Sea and north Bay of Bengal. */
const ACTIVE_TRACK_OFFSETS: [number, number, number, number][] = [
  [-48, 14.8, 98.2, 22],  // Southern Myanmar / Andaman Sea genesis
  [-36, 15.6, 97.6, 26],  // Mawlamyine approach & intensification
  [-24, 16.4, 97.3, 30],  // North Andaman Sea / Gulf of Martaban (Deep Depression)
  [-16, 17.3, 97.0, 32],  // Landfall near Kyaikto (28 Sep night, 19:30-21:30 IST)
  [-12, 17.6, 96.8, 28],  // Crossing inland over coastal Myanmar (post-landfall)
  [-6, 18.1, 96.6, 26],   // Land depression moving NNW (29 Sep 05:30 IST)
  [0, 18.7, 96.4, 24],    // Current center: Over coastal Myanmar inland (29 Sep 11:30-14:00 IST)
  [12, 19.6, 95.8, 20],   // Moving NNW across interior Myanmar
  [24, 20.6, 94.8, 18],   // Approaching Magway / Rakhine borders
  [36, 21.6, 93.8, 16],   // Re-entering border fringes toward NE Bay / SE Bangladesh
  [48, 22.4, 92.8, 14],   // Weakening into well-marked low
  [60, 23.2, 91.8, 12],   // Remnants dissipating over northeast borders
]

export const ACTIVE_NAME = 'Deep Depression (Crossed Myanmar Coast / Weakening Inland)'
export const ACTIVE_LANDFALL_OFFSET_H = -16
export const ACTIVE_LANDFALL_PLACE = 'Crossed near Kyaikto, Myanmar'

export function activeCycleBase(now: number) {
  return floorTo(now, 6 * HOUR)
}

export function activeTrack(now: number): TrackPoint[] {
  const base = activeCycleBase(now)
  return ACTIVE_TRACK_OFFSETS.map(([h, lat, lon, windKt]) => ({ lat, lon, windKt, t: base + h * HOUR }))
}

export type CycloneState = {
  lat: number
  lon: number
  windKt: number
  pressure: number
  headingDeg: number
  speedKmh: number
}

export function interpolateTrack(track: TrackPoint[], t: number): CycloneState | null {
  if (!track.length || track[0].t === undefined) return null
  if (t < track[0].t! || t > track[track.length - 1].t!) return null
  let i = 0
  while (i < track.length - 2 && track[i + 1].t! < t) i++
  const a = track[i]
  const b = track[i + 1]
  const f = (t - a.t!) / (b.t! - a.t!)
  const lat = a.lat + (b.lat - a.lat) * f
  const lon = a.lon + (b.lon - a.lon) * f
  const windKt = a.windKt + (b.windKt - a.windKt) * f
  const dy = (b.lat - a.lat) * 111
  const dx = (b.lon - a.lon) * 111 * Math.cos((lat * Math.PI) / 180)
  const hours = (b.t! - a.t!) / HOUR
  return {
    lat,
    lon,
    windKt,
    pressure: pressureFromWind(windKt),
    headingDeg: (Math.atan2(dx, dy) * 180) / Math.PI + (dx < 0 ? 360 : 0),
    speedKmh: Math.hypot(dx, dy) / hours,
  }
}

export const IMD_WARNING_STAGES = [
  { key: 'watch', label: 'Pre-Cyclone Watch', lead: '72 h', color: '#facc15' },
  { key: 'alert', label: 'Cyclone Alert', lead: '48 h', color: '#fbbf24' },
  { key: 'warning', label: 'Cyclone Warning', lead: '24 h', color: '#fb923c' },
  { key: 'post', label: 'Post-Landfall Outlook', lead: '12 h', color: '#ef4444' },
] as const

export function warningStageIndex(hoursToLandfall: number) {
  if (hoursToLandfall <= 12) return 3
  if (hoursToLandfall <= 24) return 2
  if (hoursToLandfall <= 48) return 1
  if (hoursToLandfall <= 72) return 0
  return -1
}

export function formatCoords(lat: number, lon: number): string {
  const latStr = `${Math.abs(lat).toFixed(1)}°${lat >= 0 ? 'N' : 'S'}`
  const lonStr = `${Math.abs(lon).toFixed(1)}°${lon >= 0 ? 'E' : 'W'}`
  return `${latStr} ${lonStr}`
}

const COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
export function compass(deg: number) {
  return COMPASS[Math.round((((deg % 360) + 360) % 360) / 22.5) % 16]
}
