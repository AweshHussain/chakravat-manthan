'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import {
  ACTIVE_LANDFALL_OFFSET_H,
  ACTIVE_LANDFALL_PLACE,
  ACTIVE_NAME,
  ARCHIVE_CYCLONES,
  IMD_CATEGORIES,
  IMD_WARNING_STAGES,
  activeCycleBase,
  activeTrack,
  compass,
  interpolateTrack,
  warningStageIndex,
  type TrackPoint,
} from '@/lib/cyclones'
import { createSampler, type WindData } from '@/lib/wind-field'
import { DAY, HOUR, TEN_MIN, floorTo, istDayStart, isDaylight } from '@/lib/time'
import type { ActiveCycloneView, FlyTarget, MapPin } from './map-view'
import { TopDock, type Page } from './top-dock'
import { DaySelector } from './day-selector'
import { TimeScrubber } from './time-scrubber'
import { PointCard, type PointWeather } from './point-card'
import { CyclonePanel, type CyclonePanelData } from './cyclone-panel'
import { ArchivePanel } from './archive-panel'
import { PipelineTelemetryModal } from './pipeline-modal'

const MapView = dynamic(() => import('./map-view'), { ssr: false })

type SatelliteInfo = { layer: string; latest: number; frames: number[] }
type OpenMeteoPoint = {
  hourly: {
    time: string[]
    temperature_2m: number[]
    wind_speed_10m: number[]
    wind_gusts_10m: number[]
    wind_direction_10m: number[]
    surface_pressure: number[]
  }
}

const fetcher = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}

const toIso = (ms: number) => new Date(ms).toISOString().replace('.000Z', 'Z')

export default function Dashboard() {
  const [now] = useState(() => Date.now())
  const [page, setPage] = useState<Page>('live')
  const [timeState, setTimeState] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)
  const [showClouds, setShowClouds] = useState(true)
  const [enhancedIr, setEnhancedIr] = useState(false)
  const [showWind, setShowWind] = useState(true)
  const [systemActive, setSystemActive] = useState(true)
  const [activeDismissed, setActiveDismissed] = useState(false)
  // Basemap override: null = automatic diurnal sync with timeline (Day = Satellite, Night = Black Marble)
  const [basemapOverride, setBasemapOverride] = useState<'auto' | 'night' | 'satellite'>('auto')
  const [showRadar, setShowRadar] = useState(true)
  const [showDistricts, setShowDistricts] = useState(true)
  const [archiveId, setArchiveId] = useState<string | null>(null)
  const [point, setPoint] = useState<{ lat: number; lon: number } | null>(null)
  const [flyTo, setFlyTo] = useState<FlyTarget | null>(null)
  const [locating, setLocating] = useState(false)
  const [pipelineModalOpen, setPipelineModalOpen] = useState(false)

  // Secret Admin Hotkey: Ctrl+Shift+P (or Cmd+Shift+P on Mac)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault()
        setPipelineModalOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const { data: sat } = useSWR<SatelliteInfo>('/api/satellite', fetcher, { refreshInterval: 10 * 60 * 1000 })
  const { data: wind } = useSWR<WindData>('/api/wind', fetcher, { revalidateOnFocus: false })
  const { data: liveBackend, mutate: mutateLiveBackend } = useSWR<any>('/api/cyclone/current', fetcher, {
    refreshInterval: 60 * 1000,
    revalidateOnFocus: true,
  })

  const latestSat = sat?.latest ?? floorTo(now - HOUR, TEN_MIN)
  const minTime = sat?.frames[0] ?? latestSat - 3 * HOUR
  const maxTime = wind ? Math.min(wind.times[wind.times.length - 1], now + 4.75 * DAY) : now + 4.5 * DAY
  const time = timeState ?? latestSat

  // Dynamic Diurnal Basemap:
  // When in 'auto' mode (default), daytime (06:00 to 18:30 IST) switches automatically to
  // True-Color Daylight Earth Imagery ('satellite'). Nighttime switches to NASA VIIRS Black Marble ('night').
  const effectiveBasemap: 'night' | 'satellite' = useMemo(() => {
    if (basemapOverride !== 'auto') return basemapOverride
    return isDaylight(time) ? 'satellite' : 'night'
  }, [basemapOverride, time])

  const cycleBasemap = useCallback(() => {
    setBasemapOverride((prev) => {
      // Cycle: auto -> satellite (Daylight forced) -> night (Night lights forced) -> auto
      if (prev === 'auto') return 'satellite'
      if (prev === 'satellite') return 'night'
      return 'auto'
    })
  }, [])

  const satTime = sat ? toIso(time <= latestSat ? floorTo(Math.max(time, minTime), TEN_MIN) : latestSat) : null

  const track = useMemo(() => {
    if (liveBackend?.track_points && Array.isArray(liveBackend.track_points) && liveBackend.track_points.length > 0) {
      const base = activeCycleBase(now)
      const count = liveBackend.track_points.length
      return liveBackend.track_points.map((pt: any, i: number) => ({
        lat: pt.lat,
        lon: pt.lon,
        windKt: pt.wind_kt,
        t: base - (count - 1 - i) * 6 * HOUR,
      }))
    }
    return activeTrack(now)
  }, [now, liveBackend?.track_points])

  const activeState = systemActive ? interpolateTrack(track, time) : null

  const sampler = useMemo(() => {
    if (!wind) return null
    // Only inject a rotating cyclone vortex if liveBackend has loaded AND confirms an actual active tropical storm (>28 kt)
    if (!liveBackend) return createSampler(wind, time, null)

    const currentWind = liveBackend?.continuous_measurements?.neural_regression_head?.wind_speed_knots ?? 0
    const stageCode = liveBackend?.intensity_stage?.code
    const stormName = liveBackend?.storm || ''
    const isStormActive = currentWind >= 28 && stageCode !== 'FAIR' && stageCode !== 'TD' && !stormName.includes('Basin') && !stormName.toLowerCase().includes('fair')
    
    const vortex = (activeState && isStormActive)
      ? { lat: activeState.lat, lon: activeState.lon, vmaxKmh: currentWind * 1.852 * 0.9, rmwKm: 45 }
      : null
    return createSampler(wind, time, vortex)
  }, [wind, time, activeState?.lat, activeState?.lon, activeState?.windKt, liveBackend])

  const activeView: ActiveCycloneView | null = useMemo(() => {
    // If systemActive is toggled off or activeState is null, do not show
    if (!activeState || !liveBackend) return null

    // Strictly verify against satellite & neural model telemetry:
    // Only display if actual cyclogenesis / deep depression (wind >= 28 kt, not FAIR or normal basin)
    const currentWind = liveBackend?.continuous_measurements?.neural_regression_head?.wind_speed_knots ?? 0
    const stageCode = liveBackend?.intensity_stage?.code
    const stormName = liveBackend?.storm || ''
    const isCycloneActive =
      currentWind >= 28 &&
      stageCode !== 'FAIR' &&
      stageCode !== 'TD' &&
      !stormName.includes('Basin') &&
      !stormName.toLowerCase().includes('fair')

    // If ocean is calm / fair weather according to satellite data, do NOT render fake cyclone
    if (!isCycloneActive) return null

    return {
      name: stormName,
      state: activeState,
      track,
      now: time,
      geometry: liveBackend?.aerial_top_view_geometry
        ? {
            outerRadiusKm: liveBackend.aerial_top_view_geometry.outer_radius_km,
            cdoRadiusKm: liveBackend.aerial_top_view_geometry.cdo_radius_km,
            eyeRadiusKm: liveBackend.aerial_top_view_geometry.eye_radius_km,
          }
        : {
            outerRadiusKm: Math.round(activeState.windKt * 3.4),
            cdoRadiusKm: Math.round(activeState.windKt * 1.3),
            eyeRadiusKm: activeState.windKt >= 64 ? 18 : 0,
          },
    }
  }, [activeState, track, time, liveBackend])

  const archiveCyclone = page === 'archive' ? (ARCHIVE_CYCLONES.find((c) => c.id === archiveId) ?? null) : null

  const panelData: CyclonePanelData | null = useMemo(() => {
    if (archiveCyclone) {
      const peakIndex = archiveCyclone.track.reduce((best, p, i, arr) => (p.windKt > arr[best].windKt ? i : best), 0)
      const peak = archiveCyclone.track[peakIndex]
      return {
        kind: 'archive',
        name: archiveCyclone.name,
        subtitle: `${archiveCyclone.basin} · ${archiveCyclone.year} · values at peak intensity`,
        windKt: archiveCyclone.peakWindKt,
        pressure: archiveCyclone.minPressure,
        lat: peak.lat,
        lon: peak.lon,
        headingDeg: null,
        speedKmh: null,
        warningIndex: 3,
        warningNote: 'Historical system. All IMD bulletins for this event have expired; the full warning sequence was issued ahead of landfall.',
        series: archiveCyclone.track.map((p) => p.windKt),
        seriesIndex: peakIndex,
        landfall: archiveCyclone.landfall,
        geometry: {
          outerRadiusKm: Math.round(archiveCyclone.peakWindKt * 3.8),
          cdoRadiusKm: Math.round(archiveCyclone.peakWindKt * 1.5),
          eyeRadiusKm: archiveCyclone.peakWindKt >= 64 ? 22 : 0,
        },
      }
    }
    if (page === 'live' && activeState) {
      const landfallAt = activeCycleBase(now) + ACTIVE_LANDFALL_OFFSET_H * HOUR
      const hoursTo = (landfallAt - time) / HOUR
      const idx = hoursTo < 0 ? 3 : warningStageIndex(hoursTo)
      const stage = idx >= 0 ? IMD_WARNING_STAGES[idx as 0 | 1 | 2 | 3] : null
      const first = track[0].t!
      const last = track[track.length - 1].t!

      // If backend reports live prediction, merge telemetry seamlessly
      const backendWind = liveBackend?.continuous_measurements?.neural_regression_head?.wind_speed_knots
      const backendPress = liveBackend?.continuous_measurements?.neural_regression_head?.central_pressure_hpa
      const backendStorm = liveBackend?.storm || ACTIVE_NAME

      // Format real PyTorch backend stage probabilities if present
      let customProbabilities = undefined
      if (liveBackend?.stage_probabilities) {
        const rawProbs = liveBackend.stage_probabilities
        customProbabilities = IMD_CATEGORIES.map((cat) => ({
          code: cat.code,
          color: cat.color,
          p: (rawProbs[cat.code] ?? 0) / 100
        }))
      }

      const isFair = backendWind === undefined || backendWind <= 25 || liveBackend?.intensity_stage?.code === 'FAIR' || liveBackend?.intensity_stage?.code === 'D'

      return {
        kind: 'active',
        name: backendStorm,
        subtitle: isFair
          ? 'Bay of Bengal & Arabian Sea · Fair Weather · No Active Cyclone'
          : liveBackend?.intensity_trend || `Bay of Bengal · Active System · heading ${compass(activeState.headingDeg)}`,
        windKt: backendWind ?? (isFair ? 14 : activeState.windKt),
        pressure: backendPress ?? (isFair ? 1010 : activeState.pressure),
        lat: isFair ? 16.5 : activeState.lat,
        lon: isFair ? 86.5 : activeState.lon,
        headingDeg: isFair ? null : activeState.headingDeg,
        speedKmh: isFair ? null : activeState.speedKmh,
        warningIndex: isFair ? -1 : idx,
        warningNote: isFair
          ? 'Normal synoptic conditions across Indian coastal waters. No cyclone watches, warnings, or alerts in effect.'
          : hoursTo < 0
            ? `System made landfall ${Math.round(-hoursTo)} h ago and is weakening inland. Heavy rainfall outlook remains in effect.`
            : `${stage ? stage.label : 'Monitoring'} in effect. Expected landfall in ~${Math.round(hoursTo)} h. Fishermen advised not to venture into the sea.`,
        series: track.map((p: TrackPoint) => p.windKt),
        seriesIndex: ((time - first) / (last - first)) * (track.length - 1),
        landfall: isFair ? 'No Impending Landfall' : `${ACTIVE_LANDFALL_PLACE} (forecast)`,
        customProbabilities,
        geometry: isFair
          ? { outerRadiusKm: 0, cdoRadiusKm: 0, eyeRadiusKm: 0 }
          : liveBackend?.aerial_top_view_geometry
          ? {
              outerRadiusKm: liveBackend.aerial_top_view_geometry.outer_radius_km,
              cdoRadiusKm: liveBackend.aerial_top_view_geometry.cdo_radius_km,
              eyeRadiusKm: liveBackend.aerial_top_view_geometry.eye_radius_km,
            }
          : {
              outerRadiusKm: Math.round(activeState.windKt * 3.6),
              cdoRadiusKm: Math.round(activeState.windKt * 1.3),
              eyeRadiusKm: activeState.windKt >= 64 ? 20 : 0,
            },
      }
    }
    return null
  }, [archiveCyclone, page, activeState, now, time, track, liveBackend])

  const panelOpen = Boolean(panelData) && (panelData?.kind === 'archive' || !activeDismissed)

  const pointKey = point
    ? `https://api.open-meteo.com/v1/forecast?latitude=${point.lat.toFixed(3)}&longitude=${point.lon.toFixed(3)}&hourly=temperature_2m,wind_speed_10m,wind_gusts_10m,wind_direction_10m,surface_pressure&past_days=1&forecast_days=6&timezone=UTC&wind_speed_unit=kmh`
    : null
  const { data: pointData, error: pointError, isLoading: pointLoading } = useSWR<OpenMeteoPoint>(pointKey, fetcher, {
    revalidateOnFocus: false,
  })

  const pointWeather: PointWeather | null = useMemo(() => {
    if (!pointData) return null
    const h = pointData.hourly
    const target = floorTo(time + HOUR / 2, HOUR)
    let idx = h.time.findIndex((t) => Date.parse(`${t}:00Z`) === target)
    if (idx < 0) idx = Math.max(0, h.time.length - 1)
    return {
      windSpeed: h.wind_speed_10m[idx] ?? 0,
      gusts: h.wind_gusts_10m[idx] ?? 0,
      direction: h.wind_direction_10m[idx] ?? 0,
      pressure: h.surface_pressure[idx] ?? 0,
      temperature: h.temperature_2m[idx] ?? 0,
    }
  }, [pointData, time])

  const pin: MapPin | null = useMemo(
    () =>
      point
        ? {
            lat: point.lat,
            lon: point.lon,
            label: pointWeather ? `Gusts ${Math.round(pointWeather.gusts)} km/h ${compass(pointWeather.direction)}` : null,
            dirDeg: pointWeather?.direction ?? null,
          }
        : null,
    [point, pointWeather],
  )

  const stepTime = useCallback(
    (dir: 1 | -1, loop = false) => {
      setTimeState((prev) => {
        const t = prev ?? latestSat
        if (dir === 1) {
          if (t < latestSat) return Math.min(t + TEN_MIN, latestSat)
          if (loop && t === latestSat) return minTime
          const next = t + HOUR
          if (next > maxTime) return loop ? latestSat : t
          return next
        }
        if (t > latestSat) return Math.max(latestSat, t - HOUR)
        return Math.max(minTime, t - TEN_MIN)
      })
    },
    [latestSat, minTime, maxTime],
  )

  useEffect(() => {
    if (!playing) return
    const inForecast = time > latestSat
    const id = window.setInterval(() => {
      setTimeState((prev) => {
        const t = prev ?? latestSat
        if (!inForecast) return t >= latestSat ? minTime : Math.min(t + TEN_MIN, latestSat)
        const next = t + HOUR
        return next > maxTime ? latestSat + HOUR : next
      })
    }, inForecast ? 650 : 750)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, latestSat, minTime, maxTime, time > latestSat])

  const selectDay = (offset: number) => {
    setPlaying(false)
    if (offset === 0) return setTimeState(latestSat)
    const hourOfDay = floorTo(time - istDayStart(time), HOUR)
    setTimeState(Math.min(maxTime, istDayStart(now) + offset * DAY + hourOfDay))
  }

  const locate = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        setPoint({ lat: pos.coords.latitude, lon: pos.coords.longitude })
        setFlyTo({ lat: pos.coords.latitude, lon: pos.coords.longitude, zoom: 7, key: Date.now() })
      },
      () => setLocating(false),
      { enableHighAccuracy: false, timeout: 10000 },
    )
  }

  const changePage = (next: Page) => {
    setPage(next)
    if (next === 'live') {
      setArchiveId(null)
      setActiveDismissed(false)
      setFlyTo({ lat: 17, lon: 84, zoom: 5, key: Date.now() })
    }
  }

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-slate-950 text-slate-100">
      <MapView
        satTime={satTime}
        showClouds={showClouds}
        irMode={enhancedIr ? 'enhanced' : 'natural'}
        sampler={sampler}
        showWind={showWind}
        activeCyclone={page === 'live' ? activeView : null}
        archiveCyclone={archiveCyclone}
        pin={pin}
        flyTo={flyTo}
        basemap={effectiveBasemap}
        showRadar={showRadar}
        showDistricts={showDistricts && Boolean(activeView)}
        onMapClick={(lat, lon) => setPoint({ lat, lon })}
        onCycloneClick={() => setActiveDismissed(false)}
      />

      <div className="pointer-events-none absolute inset-0 z-[400] bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(2,6,23,0.65)_100%)]" aria-hidden="true" />

      <TopDock
        page={page}
        onPageChange={changePage}
        showClouds={showClouds}
        onToggleClouds={() => setShowClouds((v) => !v)}
        enhancedIr={enhancedIr}
        onToggleEnhanced={() => setEnhancedIr((v) => !v)}
        showWind={showWind}
        onToggleWind={() => setShowWind((v) => !v)}
        systemActive={systemActive}
        onToggleSystem={() => {
          setSystemActive((prev) => {
            const next = !prev
            setActiveDismissed(!next)
            return next
          })
        }}
        basemap={effectiveBasemap}
        basemapMode={basemapOverride}
        onCycleBasemap={cycleBasemap}
        showRadar={showRadar}
        onToggleRadar={() => setShowRadar((v) => !v)}
        showDistricts={showDistricts}
        onToggleDistricts={() => setShowDistricts((v) => !v)}
        onOpenPipeline={() => setPipelineModalOpen(true)}
      />

      <PipelineTelemetryModal
        open={pipelineModalOpen}
        onClose={() => setPipelineModalOpen(false)}
        data={liveBackend}
        onRefresh={() => mutateLiveBackend()}
      />

      {page === 'live' && point && (
        <PointCard
          lat={point.lat}
          lon={point.lon}
          weather={pointWeather}
          loading={pointLoading}
          error={Boolean(pointError)}
          onClose={() => setPoint(null)}
        />
      )}

      {page === 'archive' && <ArchivePanel selectedId={archiveId} onSelect={setArchiveId} />}

      <DaySelector now={now} time={time} onSelectDay={selectDay} onLocate={locate} locating={locating} shifted={panelOpen} />

      <CyclonePanel
        open={panelOpen}
        data={panelData}
        onClose={() => {
          if (panelData?.kind === 'archive') {
            setArchiveId(null)
          } else {
            setActiveDismissed(true)
            setSystemActive(false)
          }
        }}
      />

      <TimeScrubber
        time={time}
        minTime={minTime}
        maxTime={maxTime}
        latestSat={latestSat}
        playing={playing}
        onTogglePlay={() => setPlaying((p) => !p)}
        onStep={(dir) => {
          setPlaying(false)
          stepTime(dir)
        }}
        onChange={(t) => {
          setPlaying(false)
          setTimeState(t)
        }}
        panelOpen={panelOpen}
      />

      {!sat || !wind ? (
        <div className="glass pointer-events-none absolute bottom-24 left-1/2 z-[1000] -translate-x-1/2 rounded-full px-3 py-1.5 font-mono text-[11px] text-slate-300">
          <span className="mr-2 inline-block size-1.5 animate-pulse rounded-full bg-cyan-300" aria-hidden="true" />
          {!sat ? 'Syncing Himawari-9 IR frames…' : 'Loading wind field…'}
        </div>
      ) : null}
    </main>
  )
}
