import type L from 'leaflet'

export type IrMode = 'natural' | 'enhanced'

const GREY_LOW = 112
const GREY_HIGH = 240
const LIMB_FADE_START = 50
const LIMB_FADE_END = 60

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
 * Natural mode remaps it to luminous white clouds with alpha so night lights show through,
 * and fades the far-western limb of the Himawari disk to avoid a hard data edge.
 */
function toNaturalClouds(img: HTMLImageElement, canvas: HTMLCanvasElement, coords: L.Coords) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(img, 0, 0, 256, 256)
  const image = ctx.getImageData(0, 0, 256, 256)
  const d = image.data
  const limb = limbAlpha(coords.x, coords.z)
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3]
    if (a === 0) continue
    const r = d[i]
    const g = d[i + 1]
    const b = d[i + 2]
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let t: number
    if (max - min > 36) {
      t = 1
    } else {
      t = Math.min(1, Math.max(0, (r - GREY_LOW) / (GREY_HIGH - GREY_LOW)))
      t = Math.pow(t * t * (3 - 2 * t), 1.15)
    }
    const tone = 190 + 65 * t
    d[i] = tone
    d[i + 1] = tone
    d[i + 2] = Math.min(255, tone + 8)
    d[i + 3] = Math.round(t * 235 * (a / 255) * limb[(i >> 2) & 255])
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
