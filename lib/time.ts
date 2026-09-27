export const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000
export const HOUR = 60 * 60 * 1000
export const DAY = 24 * HOUR
export const TEN_MIN = 10 * 60 * 1000

const istFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Kolkata',
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

export function formatIST(ms: number) {
  const parts = istFormatter.formatToParts(new Date(ms))
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return `${get('day')} ${get('month')} ${get('hour')}:${get('minute')}`
}

export function istDayStart(ms: number) {
  return Math.floor((ms + IST_OFFSET_MS) / DAY) * DAY - IST_OFFSET_MS
}

export function istWeekday(ms: number) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', weekday: 'short' }).format(new Date(ms))
}

export function toISTInputValue(ms: number) {
  return new Date(ms + IST_OFFSET_MS).toISOString().slice(0, 16)
}

export function fromISTInputValue(value: string) {
  return Date.parse(`${value}:00Z`) - IST_OFFSET_MS
}

export function floorTo(ms: number, step: number) {
  return Math.floor(ms / step) * step
}

/**
 * Determines whether a given timestamp falls during daylight hours across
 * the Pan-Asia / Indian subcontinent domain (~06:00 to 18:30 IST / solar time).
 * 06:00 to 18:30 IST = True-color Daylight Satellite
 * 18:30 to 06:00 IST = NASA VIIRS Black Marble Night Lights
 */
export function isDaylight(ms: number): boolean {
  // Convert to IST decimal hours (0.0 to 24.0)
  const istDate = new Date(ms + IST_OFFSET_MS)
  const hours = istDate.getUTCHours() + istDate.getUTCMinutes() / 60
  // Daylight across the Bay of Bengal, Arabian Sea, and Indian Subcontinent
  return hours >= 6.0 && hours < 18.5
}
