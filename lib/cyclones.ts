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
  track: TrackPoint[]
}

const tp = (lat: number, lon: number, windKt: number): TrackPoint => ({ lat, lon, windKt })

export const ARCHIVE_CYCLONES: ArchiveCyclone[] = [
  {
    id: 'amphan-2020',
    name: 'Amphan',
    year: 2020,
    basin: 'Bay of Bengal',
    peakWindKt: 130,
    minPressure: 920,
    landfall: 'Digha–Hatiya, West Bengal · 20 May',
    track: [tp(9.5, 87.5, 20), tp(9.8, 86.4, 25), tp(13.7, 86.2, 120), tp(14.8, 86.5, 130), tp(16.0, 86.9, 120), tp(17.4, 87.0, 105), tp(18.7, 87.3, 100), tp(20.6, 88.0, 90), tp(22.8, 88.6, 65)],
  },
  {
    id: 'kyarr-2019',
    name: 'Kyarr',
    year: 2019,
    basin: 'Arabian Sea',
    peakWindKt: 130,
    minPressure: 922,
    landfall: 'Open Arabian Sea Super Cyclone · Record Intensity',
    track: [tp(15.1, 67.2, 20), tp(17.2, 67.4, 125), tp(18.2, 65.1, 125), tp(19.1, 63.5, 120), tp(19.6, 62.9, 100), tp(18.9, 61.4, 65), tp(17.7, 60.0, 40), tp(16.2, 59.0, 25), tp(14.0, 56.6, 25)],
  },
  {
    id: 'fani-2019',
    name: 'Fani',
    year: 2019,
    basin: 'Bay of Bengal',
    peakWindKt: 115,
    minPressure: 932,
    landfall: 'Puri, Odisha · 3 May',
    track: [tp(1.9, 90.2, 25), tp(3.5, 89.7, 25), tp(6.0, 89.2, 45), tp(8.0, 87.6, 45), tp(10.5, 86.9, 55), tp(13.4, 84.6, 95), tp(14.8, 84.2, 100), tp(16.8, 84.8, 110), tp(19.6, 85.7, 100)],
  },
  {
    id: 'tauktae-2021',
    name: 'Tauktae',
    year: 2021,
    basin: 'Arabian Sea',
    peakWindKt: 100,
    minPressure: 950,
    landfall: 'Diu / Saurashtra Coast, Gujarat · 17 May',
    track: [tp(11.2, 72.5, 25), tp(12.8, 72.4, 45), tp(14.6, 72.6, 75), tp(16.5, 72.2, 95), tp(18.5, 71.5, 100), tp(20.8, 71.1, 100), tp(22.5, 71.5, 50), tp(24.0, 72.8, 25)],
  },
]

/** Scenario system used to demonstrate the live analytics workflow. Offsets are hours from the current 6-hourly synoptic cycle. */
const ACTIVE_TRACK_OFFSETS: [number, number, number, number][] = [
  [-48, 12.0, 92.5, 30],
  [-36, 12.8, 91.6, 40],
  [-24, 13.6, 90.6, 50],
  [-12, 14.5, 89.6, 65],
  [0, 15.4, 88.7, 80],
  [12, 16.4, 87.9, 90],
  [24, 17.5, 87.3, 95],
  [36, 18.8, 86.9, 85],
  [48, 20.0, 86.8, 62],
  [60, 21.2, 86.4, 35],
  [72, 22.3, 86.0, 24],
]

export const ACTIVE_NAME = 'North Indian Ocean Basin'
export const ACTIVE_LANDFALL_OFFSET_H = 48
export const ACTIVE_LANDFALL_PLACE = 'No Impending Landfall'

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

const COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
export function compass(deg: number) {
  return COMPASS[Math.round((((deg % 360) + 360) % 360) / 22.5) % 16]
}
