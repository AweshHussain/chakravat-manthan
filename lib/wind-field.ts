export type WindData = {
  lats: number[]
  lons: number[]
  times: number[]
  u: number[][]
  v: number[][]
}

export type Vortex = { lat: number; lon: number; vmaxKmh: number; rmwKm: number }

export type WindSampler = (lat: number, lon: number) => [number, number] | null

export function createSampler(data: WindData, time: number, vortex: Vortex | null): WindSampler {
  const { lats, lons, times } = data
  const nLat = lats.length
  const nLon = lons.length
  const size = nLat * nLon

  let k = 0
  while (k < times.length - 2 && times[k + 1] <= time) k++
  const span = times[k + 1] - times[k] || 1
  const f = Math.min(1, Math.max(0, (time - times[k]) / span))
  const u = new Float32Array(size)
  const v = new Float32Array(size)
  const u0 = data.u[k]
  const u1 = data.u[Math.min(k + 1, times.length - 1)]
  const v0 = data.v[k]
  const v1 = data.v[Math.min(k + 1, times.length - 1)]
  for (let i = 0; i < size; i++) {
    u[i] = u0[i] + (u1[i] - u0[i]) * f
    v[i] = v0[i] + (v1[i] - v0[i]) * f
  }

  const lat0 = lats[0]
  const lon0 = lons[0]
  const dLat = lats[1] - lats[0]
  const dLon = lons[1] - lons[0]
  const latMax = lats[nLat - 1]
  const lonMax = lons[nLon - 1]
  const cosV = vortex ? Math.cos((vortex.lat * Math.PI) / 180) : 1

  return (lat, lon) => {
    if (lat < lat0 || lat > latMax || lon < lon0 || lon > lonMax) return null
    const fy = (lat - lat0) / dLat
    const fx = (lon - lon0) / dLon
    const y0 = Math.min(nLat - 2, Math.floor(fy))
    const x0 = Math.min(nLon - 2, Math.floor(fx))
    const ty = fy - y0
    const tx = fx - x0
    const i00 = y0 * nLon + x0
    const i01 = i00 + 1
    const i10 = i00 + nLon
    const i11 = i10 + 1
    let eu = (u[i00] * (1 - tx) + u[i01] * tx) * (1 - ty) + (u[i10] * (1 - tx) + u[i11] * tx) * ty
    let ev = (v[i00] * (1 - tx) + v[i01] * tx) * (1 - ty) + (v[i10] * (1 - tx) + v[i11] * tx) * ty

    if (vortex) {
      const dx = (lon - vortex.lon) * 111 * cosV
      const dy = (lat - vortex.lat) * 111
      const r = Math.hypot(dx, dy) + 0.001
      if (r < 1400) {
        const vt = r < vortex.rmwKm ? (vortex.vmaxKmh * r) / vortex.rmwKm : vortex.vmaxKmh * (vortex.rmwKm / r) ** 0.55
        const tu = (-dy / r) * vt - (dx / r) * vt * 0.32
        const tv = (dx / r) * vt - (dy / r) * vt * 0.32
        const w = Math.exp(-((r / 650) ** 2))
        eu = w * tu + (1 - w) * eu
        ev = w * tv + (1 - w) * ev
      }
    }
    return [eu, ev]
  }
}
