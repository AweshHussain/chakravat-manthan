import type L from 'leaflet'
import type { WindSampler } from './wind-field'

type Particle = { lat: number; lon: number; age: number; maxAge: number }

const SPEED_BUCKETS = [
  { max: 12, style: 'rgba(148, 163, 184, 0.45)' },
  { max: 25, style: 'rgba(203, 213, 225, 0.6)' },
  { max: 45, style: 'rgba(226, 232, 240, 0.78)' },
  { max: 70, style: 'rgba(165, 243, 252, 0.9)' },
  { max: Infinity, style: 'rgba(103, 232, 249, 1)' },
]

export class WindParticles {
  private map: L.Map
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private sampler: WindSampler | null = null
  private particles: Particle[] = []
  private frame = 0
  private width = 0
  private height = 0
  private dpr = 1
  private leaflet: typeof L

  constructor(leaflet: typeof L, map: L.Map, pane: HTMLElement) {
    this.leaflet = leaflet
    this.map = map
    this.canvas = document.createElement('canvas')
    this.canvas.style.position = 'absolute'
    this.canvas.style.pointerEvents = 'none'
    pane.appendChild(this.canvas)
    this.ctx = this.canvas.getContext('2d')!
    map.on('move', this.onMove)
    map.on('resize', this.onResize)
    this.reset()
    this.loop()
  }

  setSampler(sampler: WindSampler | null) {
    this.sampler = sampler
  }

  destroy() {
    cancelAnimationFrame(this.frame)
    this.map.off('move', this.onMove)
    this.map.off('resize', this.onResize)
    this.canvas.remove()
  }

  private onMove = () => {
    // Keep canvas anchored to the current viewport corner
    this.leaflet.DomUtil.setPosition(this.canvas, this.map.containerPointToLayerPoint([0, 0]))
  }

  private onResize = () => {
    this.reset()
  }

  private reset() {
    const size = this.map.getSize()
    this.dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.width = size.x
    this.height = size.y
    this.canvas.width = size.x * this.dpr
    this.canvas.height = size.y * this.dpr
    this.canvas.style.width = `${size.x}px`
    this.canvas.style.height = `${size.y}px`
    this.leaflet.DomUtil.setPosition(this.canvas, this.map.containerPointToLayerPoint([0, 0]))
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    const count = Math.min(4500, Math.round((size.x * size.y) / 380))
    this.particles = Array.from({ length: count }, () => this.spawn({ lat: 0, lon: 0, age: 0, maxAge: 0 }, true))
  }

  private spawn(p: Particle, randomAge = false) {
    const bounds = this.map.getBounds()
    const south = bounds.getSouth()
    const north = bounds.getNorth()
    const west = bounds.getWest()
    const east = bounds.getEast()

    // Spawn randomly within the current visible geographical bounds (with padding)
    const latSpan = north - south
    const lonSpan = east - west
    p.lat = south - 0.1 * latSpan + Math.random() * (latSpan * 1.2)
    p.lon = west - 0.1 * lonSpan + Math.random() * (lonSpan * 1.2)
    p.maxAge = 60 + Math.random() * 80
    p.age = randomAge ? Math.random() * p.maxAge : 0
    return p
  }

  private loop = () => {
    this.frame = requestAnimationFrame(this.loop)
    const ctx = this.ctx
    ctx.globalCompositeOperation = 'destination-in'
    ctx.fillStyle = 'rgba(0, 0, 0, 0.93)'
    ctx.fillRect(0, 0, this.width, this.height)
    ctx.globalCompositeOperation = 'source-over'
    if (!this.sampler) return

    const bounds = this.map.getBounds()
    const zoom = this.map.getZoom()
    // Geographic displacement scale per frame in degrees (km/h -> lat/lon delta)
    const dt = 0.003
    const paths: Path2D[] = SPEED_BUCKETS.map(() => new Path2D())

    for (const p of this.particles) {
      if (p.age++ > p.maxAge) {
        this.spawn(p)
        continue
      }

      // Sample wind flow at the particle's geographic location
      const normLon = ((p.lon + 540) % 360) - 180
      const w = this.sampler(p.lat, normLon)
      if (!w) {
        this.spawn(p)
        continue
      }

      // Start screen position
      const pt1 = this.map.latLngToContainerPoint([p.lat, p.lon])

      // Advance particle position geographically based on true vector components
      // w[0] is eastward wind u (km/h), w[1] is northward wind v (km/h)
      const cosLat = Math.max(0.2, Math.cos((p.lat * Math.PI) / 180))
      const dLon = (w[0] * dt) / (111.32 * cosLat)
      const dLat = (w[1] * dt) / 110.57

      p.lon += dLon
      p.lat += dLat

      // End screen position
      const pt2 = this.map.latLngToContainerPoint([p.lat, p.lon])

      // Classify speed for color styling
      const speed = Math.hypot(w[0], w[1])
      let b = 0
      while (speed > SPEED_BUCKETS[b].max) b++

      // Only draw line if inside or near screen viewport
      if (
        (pt1.x >= -30 && pt1.x <= this.width + 30 && pt1.y >= -30 && pt1.y <= this.height + 30) ||
        (pt2.x >= -30 && pt2.x <= this.width + 30 && pt2.y >= -30 && pt2.y <= this.height + 30)
      ) {
        paths[b].moveTo(pt1.x, pt1.y)
        paths[b].lineTo(pt2.x, pt2.y)
      } else {
        this.spawn(p)
      }
    }

    ctx.lineWidth = Math.max(1.1, Math.min(2.0, 1.0 + (zoom - 4) * 0.15))
    ctx.lineCap = 'round'
    paths.forEach((path, i) => {
      ctx.strokeStyle = SPEED_BUCKETS[i].style
      ctx.stroke(path)
    })
  }
}
