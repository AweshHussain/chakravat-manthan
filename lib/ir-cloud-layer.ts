import type L from 'leaflet'

export type IrMode = 'natural' | 'enhanced'

const GREY_LOW = 160
const GREY_HIGH = 240

// Himawari-8/9 Sub-satellite Point: 0.0°N, 140.7°E
// Smoothly fade before reaching NASA GIBS tile truncation boundary
const SAT_SUB_LON = 140.7
const SAT_MAX_RADIUS_DEG = 80.5
const SAT_FADE_START_DEG = 74.0

function pixelLimbFactor(px: number, py: number, x: number, y: number, z: number): number {
  const worldPx = 256 * (2 ** z)
  const lon = ((x * 256 + px) / worldPx) * 360 - 180
  
  // Mercator y to latitude
  const n = Math.PI - (2 * Math.PI * (y * 256 + py)) / worldPx
  const lat = (Math.atan(Math.sinh(n)) * 180) / Math.PI

  // Spherical angular distance (great-circle) from Himawari sub-satellite point (0, 140.7)
  const phi1 = (lat * Math.PI) / 180
  const dLon = ((lon - SAT_SUB_LON) * Math.PI) / 180
  const cosDist = Math.cos(phi1) * Math.cos(dLon)
  const distDeg = (Math.acos(Math.max(-1, Math.min(1, cosDist))) * 180) / Math.PI

  if (distDeg >= SAT_MAX_RADIUS_DEG) return 0
  if (distDeg <= SAT_FADE_START_DEG) return 1
  return (SAT_MAX_RADIUS_DEG - distDeg) / (SAT_MAX_RADIUS_DEG - SAT_FADE_START_DEG)
}

/**
 * GIBS serves Himawari Band 13 as an enhanced-IR palette (grey for warm, colour for cold tops).
 * Natural mode remaps it to luminous white clouds with alpha so night lights and daylight basemap
 * show through completely on clear ocean/land, preserving 100% real satellite observations
 * while eliminating rectangular tile boundary artifacts.
 */
function toNaturalClouds(img: HTMLImageElement, canvas: HTMLCanvasElement, coords: L.Coords) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.clearRect(0, 0, 256, 256)
  ctx.drawImage(img, 0, 0, 256, 256)
  const image = ctx.getImageData(0, 0, 256, 256)
  const d = image.data

  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3]
    if (a === 0) continue

    const px = (i >> 2) % 256
    const py = Math.floor((i >> 2) / 256)
    const limbFactor = pixelLimbFactor(px, py, coords.x, coords.y, coords.z)
    if (limbFactor <= 0) {
      d[i + 3] = 0
      continue
    }

    const r = d[i]
    const g = d[i + 1]
    const b = d[i + 2]
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const isEnhancedColor = max - min > 32

    let t: number
    if (isEnhancedColor) {
      // Real cold cloud tops flagged with multi-color palette
      t = 1
    } else if (r <= GREY_LOW) {
      // Warm background surface (clear ocean / warm ground) -> 100% transparent
      d[i + 3] = 0
      continue
    } else {
      // Real grey clouds (cirrus, stratus, high-altitude condensation)
      t = (r - GREY_LOW) / (GREY_HIGH - GREY_LOW)
      t = Math.pow(t * t * (3 - 2 * t), 1.25)
      // Cut off near-zero background noise to prevent rectangular tile haze
      if (t < 0.05) {
        d[i + 3] = 0
        continue
      }
    }

    // Border feathering: smoothly blend pixels that reach the 4 outer edges of a tile
    // to prevent any hard rectangular tile seams when adjacent tiles differ or terminate.
    const edgeDist = Math.min(px, 255 - px, py, 255 - py)
    const edgeFactor = edgeDist < 4 ? edgeDist / 4 : 1.0

    const tone = 205 + 50 * t
    d[i] = tone
    d[i + 1] = tone
    d[i + 2] = Math.min(255, tone + 6)
    d[i + 3] = Math.round(t * 235 * (a / 255) * limbFactor * edgeFactor)
  }
  ctx.putImageData(image, 0, 0)
}

export function createIrCloudLayer(leaflet: typeof L, time: string, mode: IrMode, options: L.GridLayerOptions) {
  const IrLayer = leaflet.GridLayer.extend({
    createTile(coords: L.Coords, done: L.DoneCallback) {
      const tile = document.createElement('canvas')
      tile.width = 256
      tile.height = 256
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.decoding = 'async'
      img.onload = () => {
        if (mode === 'natural') toNaturalClouds(img, tile, coords)
        else tile.getContext('2d')!.drawImage(img, 0, 0, 256, 256)
        done(undefined, tile)
      }
      img.onerror = () => done(undefined, tile)
      img.src = `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/Himawari_AHI_Band13_Clean_Infrared/default/${time}/GoogleMapsCompatible_Level6/${coords.z}/${coords.y}/${coords.x}.png`
      return tile
    },
  })
  const Ctor = IrLayer as unknown as new (opts: L.GridLayerOptions) => L.GridLayer
  return new Ctor({ maxNativeZoom: 6, tileSize: 256, ...options })
}
