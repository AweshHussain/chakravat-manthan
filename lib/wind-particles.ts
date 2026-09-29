import type L from 'leaflet'
import type { WindSampler } from './wind-field'

type Particle = { x: number; y: number; age: number; maxAge: number }

const SPEED_BUCKETS = [
  { max: 12, style: 'rgba(186, 230, 253, 0.55)' },
  { max: 25, style: 'rgba(125, 211, 252, 0.72)' },
  { max: 45, style: 'rgba(56, 189, 248, 0.88)' },
  { max: 70, style: 'rgba(6, 182, 212, 0.96)' },
  { max: Infinity, style: 'rgba(103, 232, 249, 1.0)' },
]

export class WindParticles {
  private map: L.Map
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private sampler: WindSampler | null = null
  private particles: Particle[] = []
  private frame = 0
  private moving = false
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
    map.on('movestart zoomstart', this.onMoveStart)
    map.on('moveend zoomend viewreset resize', this.onMoveEnd)
    map.on('move', this.onMove)
    this.reset()
    this.loop()
  }

  setSampler(sampler: WindSampler | null) {
    this.sampler = sampler
  }

  destroy() {
    cancelAnimationFrame(this.frame)
    this.map.off('movestart zoomstart', this.onMoveStart)
    this.map.off('moveend zoomend viewreset resize', this.onMoveEnd)
    this.map.off('move', this.onMove)
    this.canvas.remove()
  }

  private onMoveStart = () => {
    this.moving = true
    this.ctx.clearRect(0, 0, this.width, this.height)
  }

  private onMove = () => {
    this.leaflet.DomUtil.setPosition(this.canvas, this.map.containerPointToLayerPoint([0, 0]))
  }

  private onMoveEnd = () => {
    this.moving = false
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
    if (this.moving) return
    const ctx = this.ctx
    ctx.globalCompositeOperation = 'destination-in'
    ctx.fillStyle = 'rgba(0, 0, 0, 0.96)'
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

    ctx.lineWidth = 1.35
    ctx.lineCap = 'round'
    paths.forEach((path, i) => {
      ctx.strokeStyle = SPEED_BUCKETS[i].style
      ctx.stroke(path)
    })
  }
}
