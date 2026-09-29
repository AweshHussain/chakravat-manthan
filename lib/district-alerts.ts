export type DistrictAlert = {
  id: string
  name: string
  state: 'Odisha' | 'West Bengal' | 'Andhra Pradesh' | 'Gujarat' | 'Tamil Nadu'
  level: 'Red' | 'Orange' | 'Yellow' | 'Green'
  warning: string
  windExpectedKt: string
  center: [number, number] // [lat, lon]
  coords: [number, number][] // Polygon boundary
}

// Key vulnerable coastal districts across Indian ocean cyclone tracks
export const COASTAL_DISTRICT_ALERTS: DistrictAlert[] = [
  // --- ODISHA COAST (Fani / Titli impact zone) ---
  {
    id: 'od-puri',
    name: 'Puri District',
    state: 'Odisha',
    level: 'Red',
    warning: 'Severe gale force winds 65-80 km/h, heavy storm surge inundation along beach front.',
    windExpectedKt: '35–45 kt',
    center: [19.81, 85.83],
    coords: [
      [19.98, 85.55],
      [20.08, 85.85],
      [19.88, 86.12],
      [19.75, 85.82],
      [19.65, 85.45],
      [19.78, 85.32],
    ],
  },
  {
    id: 'od-jagatsinghpur',
    name: 'Jagatsinghpur (Paradip)',
    state: 'Odisha',
    level: 'Red',
    warning: 'Direct coastal landfall corridor. Port operations suspended, sea condition violent.',
    windExpectedKt: '40–50 kt',
    center: [20.25, 86.45],
    coords: [
      [20.38, 86.20],
      [20.45, 86.52],
      [20.28, 86.72],
      [20.10, 86.58],
      [20.12, 86.25],
    ],
  },
  {
    id: 'od-kendrapara',
    name: 'Kendrapara',
    state: 'Odisha',
    level: 'Orange',
    warning: 'Squally winds 45-55 km/h, extensive tidal surge in mangrove estuaries.',
    windExpectedKt: '30–40 kt',
    center: [20.50, 86.70],
    coords: [
      [20.65, 86.50],
      [20.78, 86.85],
      [20.52, 87.05],
      [20.35, 86.80],
      [20.40, 86.48],
    ],
  },
  {
    id: 'od-ganjam',
    name: 'Ganjam (Gopalpur)',
    state: 'Odisha',
    level: 'Orange',
    warning: 'Rough to very rough sea conditions; localized flash flooding in lowlands.',
    windExpectedKt: '25–35 kt',
    center: [19.38, 84.88],
    coords: [
      [19.65, 84.60],
      [19.75, 85.05],
      [19.45, 85.15],
      [19.22, 84.95],
      [19.15, 84.68],
    ],
  },
  {
    id: 'od-bhadrak',
    name: 'Bhadrak (Dhamra)',
    state: 'Odisha',
    level: 'Yellow',
    warning: 'Moderate rainfall with isolated heavy downpours near Dhamra port.',
    windExpectedKt: '20–30 kt',
    center: [20.90, 86.65],
    coords: [
      [21.05, 86.45],
      [21.15, 86.80],
      [20.85, 87.02],
      [20.72, 86.75],
    ],
  },

  // --- WEST BENGAL COAST (Amphan / Remal / Bulbul impact zone) ---
  {
    id: 'wb-south24',
    name: 'South 24 Parganas (Sundarbans)',
    state: 'West Bengal',
    level: 'Orange',
    warning: 'High tidal bore warning across delta estuaries; river embankments under alert.',
    windExpectedKt: '30–40 kt',
    center: [21.85, 88.50],
    coords: [
      [22.25, 88.15],
      [22.40, 88.75],
      [22.05, 89.10],
      [21.60, 88.90],
      [21.55, 88.25],
      [21.80, 88.05],
    ],
  },
  {
    id: 'wb-eastmid',
    name: 'Purba Medinipur (Digha)',
    state: 'West Bengal',
    level: 'Yellow',
    warning: 'Coastal sea wall warning; coastal tourists and bathers restricted.',
    windExpectedKt: '25–35 kt',
    center: [21.78, 87.75],
    coords: [
      [22.10, 87.55],
      [22.15, 87.95],
      [21.85, 88.10],
      [21.62, 87.55],
    ],
  },

  // --- ANDHRA PRADESH COAST (Michaung / Hudhud zone) ---
  {
    id: 'ap-vizag',
    name: 'Visakhapatnam',
    state: 'Andhra Pradesh',
    level: 'Yellow',
    warning: 'Distant cautionary signal hoisted at Visakhapatnam port; deep sea trawlers alerted.',
    windExpectedKt: '20–25 kt',
    center: [17.72, 83.30],
    coords: [
      [17.95, 83.10],
      [18.10, 83.45],
      [17.75, 83.55],
      [17.58, 83.22],
    ],
  },
  {
    id: 'ap-kakinada',
    name: 'Kakinada / East Godavari',
    state: 'Andhra Pradesh',
    level: 'Green',
    warning: 'Normal oceanic swells; monitoring synoptic movement.',
    windExpectedKt: '15–20 kt',
    center: [16.98, 82.24],
    coords: [
      [17.20, 82.05],
      [17.28, 82.40],
      [16.85, 82.42],
      [16.75, 82.10],
    ],
  },

  // --- GUJARAT COAST (Biparjoy / Tauktae zone) ---
  {
    id: 'gj-kutch',
    name: 'Kutch Coastal District (Jakhau / Mandvi)',
    state: 'Gujarat',
    level: 'Yellow',
    warning: 'Arabian sea high swell alert along Gulf of Kutch coastline.',
    windExpectedKt: '20–28 kt',
    center: [23.15, 69.20],
    coords: [
      [23.55, 68.60],
      [23.75, 69.80],
      [23.10, 70.20],
      [22.75, 69.40],
      [22.82, 68.55],
    ],
  },
  {
    id: 'gj-jamnagar',
    name: 'Jamnagar / Dwarka',
    state: 'Gujarat',
    level: 'Green',
    warning: 'Saurashtra coast seasonal breeze; no immediate severe alert.',
    windExpectedKt: '15–22 kt',
    center: [22.40, 69.25],
    coords: [
      [22.65, 68.95],
      [22.80, 69.60],
      [22.35, 69.85],
      [22.15, 69.15],
    ],
  },
]

export const ALERT_COLORS = {
  Red: { border: '#ef4444', fill: '#dc2626', text: '#fca5a5', badge: 'bg-red-500/20 text-red-300 border-red-500/40' },
  Orange: { border: '#f97316', fill: '#ea580c', text: '#fdba74', badge: 'bg-orange-500/20 text-orange-300 border-orange-500/40' },
  Yellow: { border: '#eab308', fill: '#ca8a04', text: '#fde047', badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' },
  Green: { border: '#10b981', fill: '#059669', text: '#6ee7b7', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
}
