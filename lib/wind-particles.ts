import type L from 'leaflet'
import type { WindSampler } from './wind-field'

type Particle = { x: number; y: number; age: number; maxAge: number }

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
  private lastOrigin: L.Point | null = null

  constructor(leaflet: typeof L, map: L.Map, pane: HTMLElement) {
    this.leaflet = leaflet
    this.map = map
    this.canvas = document.createElement('canvas')
    this.canvas.style.position = 'absolute'
    this.canvas.style.pointerEvents = 'none'
    pane.appendChild(this.canvas)
    this.ctx = this.canvas.getContext('2d')!
    map.on('move', this.onMove)
    map.on('moveend zoomend resize', this.onMoveEnd)
    this.reset()
    this.loop()
  }

  setSampler(sampler: WindSampler | null) {
    this.sampler = sampler
  }

  destroy() {
    cancelAnimationFrame(this.frame)
    this.map.off('move', this.onMove)
    this.map.off('moveend zoomend resize', this.onMoveEnd)
    this.canvas.remove()
  }

  private onMove = () => {
    // When the map moves, compute pixel shift so particles stay locked to their geographic place
    const newOrigin = this.map.containerPointToLayerPoint([0, 0])
    this.leaflet.DomUtil.setPosition(this.canvas, newOrigin)

    if (this.lastOrigin) {
      const dx = newOrigin.x - this.lastOrigin.x
      const dy = newOrigin.y - this.lastOrigin.y
      if (dx !== 0 || dy !== 0) {
        // Shift particle coordinates by the exact pan offset so they stay fixed over their land/sea locations
        for (const p of this.particles) {
          p.x -= dx
          p.y -= dy
        }
      }
    }
    this.lastOrigin = newOrigin
  }

  private onMoveEnd = () => {
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
    const origin = this.map.containerPointToLayerPoint([0, 0])
    this.lastOrigin = origin
    this.leaflet.DomUtil.setPosition(this.canvas, origin)
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    const count = Math.min(4500, Math.round((size.x * size.y) / 380))
    this.particles = Array.from({ length: count }, () => this.spawn({ x: 0, y: 0, age: 0, maxAge: 0 }, true))
  }

  private spawn(p: Particle, randomAge = false) {
    p.x = Math.random() * this.width
    p.y = Math.random() * this.height
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

    const zoom = this.map.getZoom()
    const scale = 0.045 * (1 + (zoom - 5) * 0.18)
    const paths: Path2D[] = SPEED_BUCKETS.map(() => new Path2D())

    for (const p of this.particles) {
      if (p.age++ > p.maxAge) {
        this.spawn(p)
        continue
      }
      const ll = this.map.containerPointToLatLng([p.x, p.y])
      const w = this.sampler(ll.lat, ((ll.lng + 540) % 360) - 180)
      if (!w) {
        this.spawn(p)
        continue
      }
      const speed = Math.hypot(w[0], w[1])
      const nx = p.x + w[0] * scale
      const ny = p.y - w[1] * scale
      let b = 0
      while (speed > SPEED_BUCKETS[b].max) b++
      paths[b].moveTo(p.x, p.y)
      paths[b].lineTo(nx, ny)
      p.x = nx
      p.y = ny
      if (nx < 0 || ny < 0 || nx > this.width || ny > this.height) this.spawn(p)
    }

    ctx.lineWidth = 1.1
    ctx.lineCap = 'round'
    paths.forEach((path, i) => {
      ctx.strokeStyle = SPEED_BUCKETS[i].style
      ctx.stroke(path)
    })
  }
}
