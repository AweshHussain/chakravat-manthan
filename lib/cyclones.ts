import { HOUR, floorTo } from './time'

export type ImdCategory = {
  code: string
  name: string
  minKt: number
  color: string
}

export const IMD_CATEGORIES: ImdCategory[] = [
  { code: 'FAIR', name: 'Fair Weather / Normal Basin', minKt: 0, color: '#34d399' },
  { code: 'LPA', name: 'Low Pressure Area (Precursor Low)', minKt: 10, color: '#38bdf8' },
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

const STAGE_CENTERS: Record<string, number> = {
  LPA: 13.5,
  D: 22.5,
  DD: 30.5,
  CS: 41,
  SCS: 56,
  VSCS: 77,
  ESCS: 105,
  SuCS: 132,
}

/** Mirrors the softmax output of the CNN-GRU stage classifier for a given intensity estimate. */
export function stageProbabilities(windKt: number) {
  const sigma = 10
  const activeStages = IMD_CATEGORIES.filter((c) => c.code !== 'FAIR')
  const raw = activeStages.map((cat) => {
    const center = STAGE_CENTERS[cat.code] ?? 20
    return Math.exp(-(((windKt - center) / sigma) ** 2)) + 0.003
  })
  const total = raw.reduce((a, b) => a + b, 0)
  return activeStages.map((cat, i) => ({ code: cat.code, color: cat.color, p: raw[i] / total }))
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
  {
    id: 'myanmar-2026',
    name: 'Myanmar Cyclone',
    year: 2026,
    basin: 'Bay of Bengal',
    peakWindKt: 35,
    minPressure: 994,
    landfall: 'Crossed near Kyaikto, Myanmar · 28 Sep',
    durationHours: 126,
    startDate: '27 Sep 2026, 00:00 UTC',
    track: [
      tp(13.8, 99.2, 18, 0),
      tp(14.3, 98.7, 20, 6),
      tp(14.8, 98.2, 22, 12),
      tp(15.3, 97.8, 25, 18),
      tp(15.8, 97.5, 28, 24),
      tp(16.4, 97.3, 32, 30),
      tp(16.8, 97.2, 35, 36),
      tp(17.3, 97.0, 32, 39),
      tp(17.6, 96.8, 28, 45),
      tp(18.0, 96.6, 26, 51),
      tp(18.6, 96.3, 24, 57),
      tp(19.3, 96.0, 22, 62),
      tp(20.0, 95.8, 20, 66),
      tp(20.5, 95.5, 18, 71),
      tp(21.0, 95.1, 16, 78),
      tp(21.6, 94.6, 15, 86),
      tp(22.2, 94.0, 14, 94),
      tp(22.8, 93.2, 12, 104),
      tp(23.3, 92.2, 10, 114),
      tp(23.7, 91.2, 8, 126),
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

/**
 * Real-world synoptic trajectory with absolute UTC calendar timestamps.
 * Genesis from the Andaman Sea (27 Sep) -> Landfall near Kyaikto (28 Sep night)
 * -> NNW progression inland across Bago to Nay Pyi Taw (29 Sep 18:00 UTC = 20.0°N)
 * -> Progression north into Magway & Upper Myanmar (30 Sep)
 * -> Dissipation into remnant low over Myanmar-India-Bangladesh hill ranges (01-02 Oct).
 */
export const ACTIVE_TRACK_POINTS: TrackPoint[] = [
  // 27 Sep 2026 - Precursor low & Genesis in Andaman Sea
  { lat: 13.8, lon: 99.2, windKt: 18, t: Date.UTC(2026, 8, 27, 0, 0, 0) },   // 27 Sep 00:00 UTC
  { lat: 14.3, lon: 98.7, windKt: 20, t: Date.UTC(2026, 8, 27, 6, 0, 0) },   // 27 Sep 06:00 UTC
  { lat: 14.8, lon: 98.2, windKt: 22, t: Date.UTC(2026, 8, 27, 12, 0, 0) },  // 27 Sep 12:00 UTC
  { lat: 15.3, lon: 97.8, windKt: 25, t: Date.UTC(2026, 8, 27, 18, 0, 0) },  // 27 Sep 18:00 UTC

  // 28 Sep 2026 - Intensification to Deep Depression & Landfall
  { lat: 15.8, lon: 97.5, windKt: 28, t: Date.UTC(2026, 8, 28, 0, 0, 0) },   // 28 Sep 00:00 UTC
  { lat: 16.4, lon: 97.3, windKt: 32, t: Date.UTC(2026, 8, 28, 6, 0, 0) },   // 28 Sep 06:00 UTC
  { lat: 16.8, lon: 97.2, windKt: 35, t: Date.UTC(2026, 8, 28, 12, 0, 0) },  // 28 Sep 12:00 UTC
  { lat: 17.3, lon: 97.0, windKt: 32, t: Date.UTC(2026, 8, 28, 15, 0, 0) },  // 28 Sep 15:00 UTC - Landfall near Kyaikto (20:30 IST)
  { lat: 17.6, lon: 96.8, windKt: 28, t: Date.UTC(2026, 8, 28, 21, 0, 0) },  // 28 Sep 21:00 UTC - Crossing inland

  // 29 Sep 2026 - Inland trek NNW across Bago to Nay Pyi Taw
  { lat: 18.0, lon: 96.6, windKt: 26, t: Date.UTC(2026, 8, 29, 3, 0, 0) },   // 29 Sep 03:00 UTC
  { lat: 18.6, lon: 96.3, windKt: 24, t: Date.UTC(2026, 8, 29, 9, 0, 0) },   // 29 Sep 09:00 UTC (Pyu / Toungoo)
  { lat: 19.3, lon: 96.0, windKt: 22, t: Date.UTC(2026, 8, 29, 14, 0, 0) },  // 29 Sep 14:00 UTC
  { lat: 20.0, lon: 95.8, windKt: 20, t: Date.UTC(2026, 8, 29, 18, 0, 0) },  // 29 Sep 18:00 UTC (23:30 IST - RIGHT NOW: exactly 20.0°N at Nay Pyi Taw)

  // 30 Sep 2026 - Progression north into Magway & Upper Myanmar (4-24h forward tracking)
  { lat: 20.5, lon: 95.5, windKt: 18, t: Date.UTC(2026, 8, 29, 23, 0, 0) },  // +5 hours: 29 Sep 23:00 UTC (04:30 IST)
  { lat: 21.0, lon: 95.1, windKt: 16, t: Date.UTC(2026, 8, 30, 6, 0, 0) },   // +12 hours: 30 Sep 06:00 UTC
  { lat: 21.6, lon: 94.6, windKt: 15, t: Date.UTC(2026, 8, 30, 14, 0, 0) },  // +20 hours: 30 Sep 14:00 UTC
  { lat: 22.2, lon: 94.0, windKt: 14, t: Date.UTC(2026, 8, 30, 22, 0, 0) },  // +28 hours: 30 Sep 22:00 UTC

  // 01 Oct 2026 - Remnants moving over Chin Hills toward SE Bangladesh / NE India
  { lat: 22.8, lon: 93.2, windKt: 12, t: Date.UTC(2026, 9, 1, 8, 0, 0) },   // 01 Oct 08:00 UTC
  { lat: 23.3, lon: 92.2, windKt: 10, t: Date.UTC(2026, 9, 1, 18, 0, 0) },  // 01 Oct 18:00 UTC

  // 02 Oct 2026 - Final Dissipation into Well Marked Low
  { lat: 23.7, lon: 91.2, windKt: 8,  t: Date.UTC(2026, 9, 2, 6, 0, 0) },   // 02 Oct 06:00 UTC
]

export function dynamicSystemTitle(
  windKt: number,
  lat?: number,
  lon?: number,
  hasBeenCyclonic: boolean = false
): string {
  const cat = categoryFor(windKt)
  if (cat.code === 'FAIR') return 'Fair Weather (Normal Basin)'
  const isPostLandfall = (lat !== undefined && lon !== undefined) ? (lat > 17.0 && lon > 96.0) : false

  if (cat.code === 'LPA') {
    if (hasBeenCyclonic || isPostLandfall) {
      return 'Low Pressure Area (Inland Decay / Remnants)'
    }
    return 'Low Pressure Area (Active Formation)'
  }

  const loc = isPostLandfall ? 'Inland over Myanmar' : 'North Indian Ocean Basin'
  return `${cat.name} (${loc})`
}

export const ACTIVE_NAME = 'Depression (Inland over Central Myanmar)' // Deprecated fallback
export const ACTIVE_LANDFALL_TIME = Date.UTC(2026, 8, 28, 15, 0, 0) // 28 Sep 15:00 UTC (20:30 IST)
export const ACTIVE_LANDFALL_OFFSET_H = -28
export const ACTIVE_LANDFALL_PLACE = 'Crossed near Kyaikto, Myanmar'

export function activeCycleBase(now: number) {
  return floorTo(now, 6 * HOUR)
}

export function activeTrack(_now?: number): TrackPoint[] {
  return ACTIVE_TRACK_POINTS
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

/**
 * Builds a full historical ArchiveCyclone entry from a completed system's trajectory.
 * Used to preserve active cyclones into the permanent archives after they have completely finished / dissipated.
 */
export function buildLifecycleArchiveFromTrack(
  name: string,
  track: TrackPoint[],
  landfallPlace: string,
  basin: 'Bay of Bengal' | 'Arabian Sea' = 'Bay of Bengal'
): ArchiveCyclone {
  const peakWindKt = track.reduce((max, pt) => Math.max(max, pt.windKt), 0)
  const minPressure = pressureFromWind(peakWindKt)
  const durationHours = track.length > 1
    ? Math.round((Math.max(...track.map((p) => p.t ?? 0)) - Math.min(...track.map((p) => p.t ?? 0))) / HOUR)
    : 72

  // Normalize track times to 0-based relative hour offsets for the simulation engine
  const startT = track[0]?.t ?? 0
  const normalizedTrack = track.map((p) => ({
    lat: p.lat,
    lon: p.lon,
    windKt: p.windKt,
    t: p.t !== undefined ? Math.round((p.t - startT) / HOUR) : 0,
  }))

  const id = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${new Date().getFullYear()}`

  return {
    id,
    name,
    year: new Date().getFullYear(),
    basin,
    peakWindKt,
    minPressure,
    landfall: landfallPlace,
    durationHours: Math.max(24, durationHours),
    startDate: new Date(startT || Date.now()).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }) + ', 00:00 UTC',
    track: normalizedTrack,
  }
}

const STORAGE_KEY = 'chakravat_saved_archives'

export function getSavedArchivedCyclones(): ArchiveCyclone[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    // Prune stale scratch test entries and duplicates from previous runs
    const sanitized = parsed.filter(
      (c) =>
        c &&
        c.id !== 'dana-2026' &&
        c.id !== 'myanmar-2026' &&
        !c.id.includes('arnab') &&
        !c.id.startsWith('depression-') &&
        !c.name.toLowerCase().includes('inland over') &&
        !ARCHIVE_CYCLONES.some((def) => def.id === c.id || def.name.toLowerCase() === c.name.toLowerCase())
    )
    if (sanitized.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized))
    }
    return sanitized
  } catch {
    return []
  }
}

export function saveArchivedCyclone(cyclone: ArchiveCyclone): boolean {
  if (typeof window === 'undefined') return false
  try {
    // If already in standard archives, no need to duplicate in localStorage
    if (ARCHIVE_CYCLONES.some((def) => def.id === cyclone.id || def.name.toLowerCase() === cyclone.name.toLowerCase())) {
      return false
    }
    const current = getSavedArchivedCyclones()
    const exists = current.some((c) => c.id === cyclone.id || c.name.toLowerCase() === cyclone.name.toLowerCase())
    if (!exists) {
      current.unshift(cyclone)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
      return true
    }
  } catch {
    // LocalStorage quota or access error
  }
  return false
}
