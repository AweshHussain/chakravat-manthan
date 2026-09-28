import type L from 'leaflet'

export type IrMode = 'natural' | 'enhanced'

const GREY_LOW = 145
const GREY_HIGH = 240
const LIMB_FADE_START = 62
const LIMB_FADE_END = 72

function limbAlpha(x: number, z: number): Float32Array {
  const col = new Float32Array(256)
  const worldPx = 256 * 2 ** z
  for (let px = 0; px < 256; px++) {
    const lon = ((x * 256 + px) / worldPx) * 360 - 180
    const t = (lon - LIMB_FADE_START) / (LIMB_FADE_END - LIMB_FADE_START)
    col[px] = Math.min(1, Math.max(0, t))
  }
  return col
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
  const limb = limbAlpha(coords.x, coords.z)

  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3]
    if (a === 0) continue

    const limbFactor = limb[(i >> 2) & 255]
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
      if (t < 0.04) {
        d[i + 3] = 0
        continue
      }
    }

    const tone = 205 + 50 * t
    d[i] = tone
    d[i + 1] = tone
    d[i + 2] = Math.min(255, tone + 6)
    d[i + 3] = Math.round(t * 235 * (a / 255) * limbFactor)
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
