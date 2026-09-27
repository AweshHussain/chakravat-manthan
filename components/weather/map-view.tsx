'use client'

import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect, useRef } from 'react'
import { createIrCloudLayer, type IrMode } from '@/lib/ir-cloud-layer'
import { WindParticles } from '@/lib/wind-particles'
import type { WindSampler } from '@/lib/wind-field'
import { categoryFor, type ArchiveCyclone, type CycloneState, type TrackPoint } from '@/lib/cyclones'

export type MapPin = { lat: number; lon: number; label: string | null; dirDeg: number | null }
export type ActiveCycloneView = {
  name: string
  state: CycloneState
  track: TrackPoint[]
  now: number
  geometry?: {
    outerRadiusKm: number
    cdoRadiusKm: number
    eyeRadiusKm: number
  }
}

export type BasemapMode = 'night' | 'satellite' | 'dark'
export type FlyTarget = { lat: number; lon: number; zoom?: number; key?: number }

type Props = {
  satTime: string | null
  showClouds: boolean
  irMode: IrMode
  sampler: WindSampler | null
  showWind: boolean
  activeCyclone: ActiveCycloneView | null
  archiveCyclone: ArchiveCyclone | null
  pin: MapPin | null
  flyTo: FlyTarget | null
  basemap: BasemapMode
  showRadar: boolean
  showDistricts: boolean
  onMapClick: (lat: number, lon: number) => void
  onCycloneClick: () => void
}

const cycloneIconHtml = (name: string, code: string, color: string) => `
  <div class="cm-cyclone" style="--c:${color}">
    <span class="cm-cyclone-pulse"></span>
    <svg class="cm-cyclone-glyph" viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="4.5" fill="none" stroke="currentColor" stroke-width="2.2"/>
      <path d="M20 6 C10 6 6 13 7 20" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M20 34 C30 34 34 27 33 20" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>
    </svg>
    <span class="cm-cyclone-label">${name} · ${code}</span>
  </div>`

const pinIconHtml = (label: string | null, dirDeg: number | null) => `
  <div class="cm-pin">
    <span class="cm-pin-dot"></span>
    <span class="cm-pin-label">${
      label
        ? `<svg viewBox="0 0 24 24" width="12" height="12" style="transform:rotate(${(dirDeg ?? 0) + 180}deg)" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>${label}`
        : 'Loading…'
    }</span>
  </div>`

function forecastCone(track: TrackPoint[], now: number) {
  const future = track.filter((p) => p.t! >= now)
  if (future.length < 2) return null
  const left: L.LatLngTuple[] = []
  const right: L.LatLngTuple[] = []
  future.forEach((p, i) => {
    const next = future[Math.min(i + 1, future.length - 1)]
    const prev = future[Math.max(i - 1, 0)]
    const dx = (next.lon - prev.lon) * Math.cos((p.lat * Math.PI) / 180)
    const dy = next.lat - prev.lat
    const len = Math.hypot(dx, dy) || 1
    const radiusDeg = (40 + ((p.t! - now) / 3_600_000) * 3.4) / 111
    const nx = (-dy / len) * radiusDeg
    const ny = (dx / len) * radiusDeg
    left.push([p.lat + ny, p.lon + nx / Math.cos((p.lat * Math.PI) / 180)])
    right.push([p.lat - ny, p.lon - nx / Math.cos((p.lat * Math.PI) / 180)])
  })
  return [...left, ...right.reverse()]
}

import { COASTAL_DISTRICT_ALERTS, ALERT_COLORS } from '@/lib/district-alerts'

export default function MapView(props: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const windRef = useRef<WindParticles | null>(null)
  const baseLayerRef = useRef<L.TileLayer | null>(null)
  const radarLayerRef = useRef<L.TileLayer | null>(null)
  const districtsGroupRef = useRef<L.LayerGroup | null>(null)
  const cloudLayersRef = useRef<L.GridLayer[]>([])
  const activeGroupRef = useRef<L.LayerGroup | null>(null)
  const archiveGroupRef = useRef<L.LayerGroup | null>(null)
  const pinRef = useRef<L.Marker | null>(null)
  const callbacksRef = useRef({ onMapClick: props.onMapClick, onCycloneClick: props.onCycloneClick })
  callbacksRef.current = { onMapClick: props.onMapClick, onCycloneClick: props.onCycloneClick }

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    // Expanded Asia Domain: From Middle East/Horn of Africa (West: 40.0°E) to Japan / Western Pacific (East: 145.0°E)
    // and Equatorial Indian Ocean (South: -10.0°S) to Central/East Asia (North: 48.0°N)
    const exactDomainBounds = L.latLngBounds(
      L.latLng(-10.0, 40.0),   // South: Equatorial IO / Maldives / Chagos; West: Red Sea / Arabian Peninsula / Iran
      L.latLng(48.0, 145.0),   // North: Central Asia / Mongolia / Japan; East: West Pacific Basin / Philippines / Japan
    )

    const map = L.map(containerRef.current, {
      zoomControl: false,
      zoomSnap: 0.1,
      maxZoom: 16,
      maxBounds: exactDomainBounds,
      maxBoundsViscosity: 0.8, // Smooth damping at outer Asia borders
    })
    mapRef.current = map

    // Center on the South Asia / Bay of Bengal & Arabian Sea focal point
    map.fitBounds(exactDomainBounds, { padding: [10, 10] })
    const computedMinZoom = map.getBoundsZoom(exactDomainBounds, true)
    map.setMinZoom(computedMinZoom)
    map.setZoom(computedMinZoom)

    map.createPane('radar').style.zIndex = '340'
    map.createPane('clouds').style.zIndex = '360'
    map.createPane('districts').style.zIndex = '380'
    map.createPane('wind').style.zIndex = '420'
    map.createPane('labels').style.zIndex = '440'
    map.getPane('labels')!.style.pointerEvents = 'none'

    // Crisp official Esri Administrative Borders, States, Districts & City Labels
    // Seamless vector tiles up to street level (no 'Zoom Level Not Supported' errors)
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      {
        pane: 'labels',
        maxNativeZoom: 13,
        maxZoom: 16,
        opacity: 0.9,
        attribution: 'Labels: Esri',
      },
    ).addTo(map)
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    map.attributionControl.setPrefix(false)

    windRef.current = new WindParticles(L, map, map.getPane('wind')!)
    districtsGroupRef.current = L.layerGroup([], { pane: 'districts' }).addTo(map)
    activeGroupRef.current = L.layerGroup().addTo(map)
    archiveGroupRef.current = L.layerGroup().addTo(map)

    map.on('click', (e: L.LeafletMouseEvent) => {
      const lon = ((e.latlng.lng + 540) % 360) - 180
      callbacksRef.current.onMapClick(e.latlng.lat, lon)
    })

    return () => {
      windRef.current?.destroy()
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Basemap switching (Night Lights vs True-Color Satellite vs Dark Matter)
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (baseLayerRef.current) {
      map.removeLayer(baseLayerRef.current)
      baseLayerRef.current = null
    }

    // NASA Black Marble level 8 caps out natively at zoom 8.
    // By setting maxNativeZoom: 8 and maxZoom: 16, Leaflet smoothly upscales the level 8 tiles
    // when you zoom in deeply, preventing NASA from returning 'Zoom Level Not Supported' tiles!
    let url = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble/default/2016-01-01/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png'
    let maxNative = 8
    let maxZ = 16
    let className = 'cm-black-marble'

    if (props.basemap === 'satellite') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      maxNative = 18
      maxZ = 18
      className = 'cm-world-imagery'
    } else if (props.basemap === 'dark') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
      maxNative = 16
      maxZ = 16
      className = 'cm-canvas-dark'
    }

    const layer = L.tileLayer(url, {
      maxNativeZoom: maxNative,
      maxZoom: maxZ,
      className,
      attribution: 'Imagery: NASA / Esri',
    })
    layer.addTo(map)
    baseLayerRef.current = layer
  }, [props.basemap])

  // Live Doppler Radar & Precipitation (RainViewer)
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (radarLayerRef.current) {
      map.removeLayer(radarLayerRef.current)
      radarLayerRef.current = null
    }
    if (!props.showRadar) return

    // Fetch latest RainViewer radar pass
    fetch('https://api.rainviewer.com/public/weather-maps.json')
      .then((r) => r.json())
      .then((data) => {
        if (!mapRef.current || !data?.radar?.past?.length) return
        const latest = data.radar.past[data.radar.past.length - 1]
        // RainViewer Doppler radar tiles natively stop at zoom 7.
        // Setting maxNativeZoom: 7 allows Leaflet to smoothly upscale the radar tiles up to street-level zoom 16
        // without RainViewer returning grey 'Zoom Level Not Supported' tile error watermarks!
        const radarLayer = L.tileLayer(
          `${data.host}${latest.path}/256/{z}/{x}/{y}/2/1_1.png`,
          {
            pane: 'radar',
            opacity: 0.8,
            maxNativeZoom: 7,
            maxZoom: 16,
            className: 'cm-rainviewer-radar',
          },
        )
        radarLayer.addTo(mapRef.current)
        radarLayerRef.current = radarLayer
      })
      .catch(() => {})
  }, [props.showRadar])

  // Coastal District Cyclone Warning Boundaries (Red, Orange, Yellow)
  useEffect(() => {
    const group = districtsGroupRef.current
    if (!group) return
    group.clearLayers()
    if (!props.showDistricts) return

    COASTAL_DISTRICT_ALERTS.forEach((d) => {
      const colors = ALERT_COLORS[d.level]
      const poly = L.polygon(d.coords, {
        color: colors.border,
        weight: 2,
        opacity: 0.9,
        fillColor: colors.fill,
        fillOpacity: 0.22,
      })

      poly.bindTooltip(
        `<div class="p-1">
          <div class="flex items-center gap-1.5 font-bold" style="color:${colors.border}">
            <span>[${d.level.toUpperCase()} ALERT]</span> ${d.name}
          </div>
          <div class="text-[10px] text-slate-300 mt-0.5">${d.warning}</div>
          <div class="text-[10px] text-cyan-300 font-mono mt-0.5">Winds: ${d.windExpectedKt}</div>
        </div>`,
        { permanent: false, direction: 'top', className: 'cm-swath-tooltip' },
      )
      poly.addTo(group)

      // Warning marker at district center
      const icon = L.divIcon({
        className: '',
        html: `<div class="rounded-full px-1.5 py-0.5 text-[9px] font-bold font-mono border shadow-md text-white whitespace-nowrap" style="background:${colors.fill}; border-color:${colors.border}">
          ${d.name.split(' ')[0]} · ${d.level}
        </div>`,
        iconSize: [60, 20],
        iconAnchor: [30, 10],
      })
      L.marker(d.center, { icon, interactive: false }).addTo(group)
    })
  }, [props.showDistricts])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (!props.showClouds || !props.satTime) {
      cloudLayersRef.current.forEach((l) => map.removeLayer(l))
      cloudLayersRef.current = []
      return
    }
    const layer = createIrCloudLayer(L, props.satTime, props.irMode, {
      pane: 'clouds',
      opacity: 0,
      className: 'cm-clouds',
      maxZoom: 16,
    })
    cloudLayersRef.current.push(layer)
    layer.once('load', () => {
      if (cloudLayersRef.current[cloudLayersRef.current.length - 1] !== layer) return
      layer.setOpacity(props.irMode === 'enhanced' ? 0.85 : 1)
      const stale = cloudLayersRef.current.filter((l) => l !== layer)
      cloudLayersRef.current = [layer]
      window.setTimeout(() => stale.forEach((l) => map.removeLayer(l)), 300)
    })
    layer.addTo(map)
  }, [props.satTime, props.showClouds, props.irMode])

  useEffect(() => {
    windRef.current?.setSampler(props.showWind ? props.sampler : null)
  }, [props.sampler, props.showWind])

  useEffect(() => {
    const group = activeGroupRef.current
    if (!group) return
    group.clearLayers()
    const cyclone = props.activeCyclone
    if (!cyclone) return
    const { track, now, state } = cyclone
    const cone = forecastCone(track, now)
    if (cone) {
      L.polygon(cone, {
        color: '#67e8f9',
        weight: 1,
        opacity: 0.5,
        fillColor: '#22d3ee',
        fillOpacity: 0.07,
        dashArray: '3 5',
        interactive: false,
      }).addTo(group)
    }
    const past = track.filter((p) => p.t! <= now).map((p) => [p.lat, p.lon] as L.LatLngTuple)
    const future = track.filter((p) => p.t! >= now).map((p) => [p.lat, p.lon] as L.LatLngTuple)
    if (past.length > 1) L.polyline(past, { color: '#e2e8f0', weight: 2, opacity: 0.7, interactive: false }).addTo(group)
    if (future.length > 1)
      L.polyline(future, { color: '#67e8f9', weight: 2, opacity: 0.9, dashArray: '6 6', interactive: false }).addTo(group)
    track.forEach((p) => {
      L.circleMarker([p.lat, p.lon], {
        radius: 3.5,
        color: '#020617',
        weight: 1,
        fillColor: categoryFor(p.windKt).color,
        fillOpacity: 1,
        interactive: false,
      }).addTo(group)
    })
    // Render real-time spatial cyclone swath circles (Outer Extent, CDO, Eye)
    const geom = cyclone.geometry || {
      outerRadiusKm: Math.max(120, state.windKt * 3.2),
      cdoRadiusKm: Math.max(45, state.windKt * 1.2),
      eyeRadiusKm: state.windKt > 64 ? 18 : 0,
    }

    // 1. Outer Convective Swath (Gale Wind Radius / R34)
    L.circle([state.lat, state.lon], {
      radius: geom.outerRadiusKm * 1000,
      color: '#38bdf8',
      weight: 2,
      opacity: 0.85,
      fillColor: '#0284c7',
      fillOpacity: 0.12,
      dashArray: '8 8',
    })
      .bindTooltip(`Outer Swath: ${geom.outerRadiusKm * 2} km total width (Gale Wind / Cloud Shield)`, {
        permanent: false,
        direction: 'top',
        className: 'cm-swath-tooltip',
      })
      .addTo(group)

    // 2. CDO Core (Severe convective thunderstorm shield)
    L.circle([state.lat, state.lon], {
      radius: geom.cdoRadiusKm * 1000,
      color: '#fbbf24',
      weight: 2,
      opacity: 0.9,
      fillColor: '#d97706',
      fillOpacity: 0.18,
    })
      .bindTooltip(`CDO Core: ${geom.cdoRadiusKm * 2} km diameter (Central Thunderstorm Shield)`, {
        permanent: false,
        direction: 'top',
        className: 'cm-swath-tooltip',
      })
      .addTo(group)

    // 3. Eye Wall (if organized)
    if (geom.eyeRadiusKm > 0) {
      L.circle([state.lat, state.lon], {
        radius: geom.eyeRadiusKm * 1000,
        color: '#f87171',
        weight: 2.5,
        opacity: 0.95,
        fillColor: '#dc2626',
        fillOpacity: 0.25,
      })
        .bindTooltip(`Eye Wall: ${geom.eyeRadiusKm * 2} km diameter (Calm Eye)`, {
          permanent: false,
          direction: 'top',
          className: 'cm-swath-tooltip',
        })
        .addTo(group)
    }

    const cat = categoryFor(state.windKt)
    L.marker([state.lat, state.lon], {
      icon: L.divIcon({ className: '', html: cycloneIconHtml(cyclone.name, cat.code, cat.color), iconSize: [48, 48], iconAnchor: [24, 24] }),
      keyboard: true,
      title: `Cyclone ${cyclone.name}`,
      zIndexOffset: 500,
    })
      .on('click', (e) => {
        L.DomEvent.stopPropagation(e)
        callbacksRef.current.onCycloneClick()
      })
      .addTo(group)
  }, [props.activeCyclone])

  useEffect(() => {
    const map = mapRef.current
    const group = archiveGroupRef.current
    if (!map || !group) return
    group.clearLayers()
    const cyclone = props.archiveCyclone
    if (!cyclone) return
    const pts = cyclone.track
    for (let i = 0; i < pts.length - 1; i++) {
      L.polyline(
        [
          [pts[i].lat, pts[i].lon],
          [pts[i + 1].lat, pts[i + 1].lon],
        ],
        { color: categoryFor(Math.max(pts[i].windKt, pts[i + 1].windKt)).color, weight: 3, opacity: 0.9, interactive: false },
      ).addTo(group)
    }
    pts.forEach((p) =>
      L.circleMarker([p.lat, p.lon], {
        radius: 4,
        color: '#020617',
        weight: 1,
        fillColor: categoryFor(p.windKt).color,
        fillOpacity: 1,
        interactive: false,
      }).addTo(group),
    )
    const peak = pts.reduce((a, b) => (b.windKt > a.windKt ? b : a))
    const cat = categoryFor(peak.windKt)

    // Render spatial swath circles at peak intensity
    const outerR = Math.round(peak.windKt * 3.8)
    const cdoR = Math.round(peak.windKt * 1.5)
    L.circle([peak.lat, peak.lon], {
      radius: outerR * 1000,
      color: '#38bdf8',
      weight: 1.5,
      opacity: 0.7,
      fillColor: '#0284c7',
      fillOpacity: 0.08,
      dashArray: '6 8',
      interactive: false,
    }).addTo(group)

    L.circle([peak.lat, peak.lon], {
      radius: cdoR * 1000,
      color: '#f59e0b',
      weight: 1.5,
      opacity: 0.8,
      fillColor: '#d97706',
      fillOpacity: 0.12,
      interactive: false,
    }).addTo(group)

    if (peak.windKt >= 64) {
      L.circle([peak.lat, peak.lon], {
        radius: 22 * 1000,
        color: '#ef4444',
        weight: 2,
        opacity: 0.9,
        fillColor: '#dc2626',
        fillOpacity: 0.18,
        interactive: false,
      }).addTo(group)
    }

    L.marker([peak.lat, peak.lon], {
      icon: L.divIcon({ className: '', html: cycloneIconHtml(cyclone.name, cat.code, cat.color), iconSize: [48, 48], iconAnchor: [24, 24] }),
      interactive: false,
    }).addTo(group)
    map.flyToBounds(L.latLngBounds(pts.map((p) => [p.lat, p.lon] as L.LatLngTuple)), {
      padding: [120, 120],
      maxZoom: 6,
      duration: 1.2,
    })
  }, [props.archiveCyclone])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    pinRef.current?.remove()
    pinRef.current = null
    if (!props.pin) return
    pinRef.current = L.marker([props.pin.lat, props.pin.lon], {
      icon: L.divIcon({ className: '', html: pinIconHtml(props.pin.label, props.pin.dirDeg), iconSize: [0, 0], iconAnchor: [0, 0] }),
      interactive: false,
      zIndexOffset: 1000,
    }).addTo(map)
  }, [props.pin])

  useEffect(() => {
    if (props.flyTo) mapRef.current?.flyTo([props.flyTo.lat, props.flyTo.lon], props.flyTo.zoom, { duration: 1.2 })
  }, [props.flyTo])

  return <div ref={containerRef} className="absolute inset-0 bg-slate-950" role="application" aria-label="Interactive weather satellite map" />
}
