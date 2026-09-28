'use client'

import { ArrowUp, Gauge, MapPin, Thermometer, Wind, X } from 'lucide-react'
import { compass } from '@/lib/cyclones'

export type PointWeather = {
  windSpeed: number
  gusts: number
  direction: number
  pressure: number
  temperature: number
}

type Props = {
  lat: number
  lon: number
  weather: PointWeather | null
  loading: boolean
  error: boolean
  onClose: () => void
}

function Stat({ icon: Icon, label, value, unit }: { icon: typeof Wind; label: string; value: string; unit: string }) {
  return (
    <div className="rounded-xl bg-white/[0.03] p-2.5">
      <dt className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-400">
        <Icon className="size-3" aria-hidden="true" />
        {label}
      </dt>
      <dd className="mt-1 font-mono text-sm tabular-nums text-slate-50">
        {value}
        <span className="ml-1 text-xs text-slate-400">{unit}</span>
      </dd>
    </div>
  )
}

export function PointCard({ lat, lon, weather, loading, error, onClose }: Props) {
  const coords = `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(2)}°${lon >= 0 ? 'E' : 'W'}`

  return (
    <section
      aria-label="Point weather"
      className="glass absolute left-3 top-20 z-[900] w-[min(280px,calc(100vw-1.5rem))] animate-in fade-in slide-in-from-left-4 rounded-2xl p-3 duration-300"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <MapPin className="size-4 text-cyan-300" aria-hidden="true" />
          <div>
            <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400">Point Weather</h2>
            <p className="font-mono text-xs text-slate-200">{coords}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1 text-slate-400 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
          aria-label="Close point weather"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      {error ? (
        <p className="mt-3 text-sm text-slate-400">Weather data unavailable for this point.</p>
      ) : loading || !weather ? (
        <div className="mt-3 space-y-2" aria-busy="true">
          <div className="h-12 animate-pulse rounded-xl bg-white/5" />
          <div className="grid grid-cols-2 gap-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-white/5" />
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-400">Wind speed</p>
              <p className="font-mono text-3xl font-light tabular-nums text-slate-50">
                {Math.round(weather.windSpeed)}
                <span className="ml-1 text-sm text-slate-400">km/h</span>
              </p>
            </div>
            <div className="flex flex-col items-center gap-1 pb-1" title={`Blowing towards ${compass(weather.direction + 180)} (${Math.round((weather.direction + 180) % 360)}°) · Originates from ${compass(weather.direction)} (${Math.round(weather.direction)}°)`}>
              <span className="flex size-10 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/10 text-cyan-300">
                <ArrowUp className="size-5 transition-transform duration-300" style={{ transform: `rotate(${weather.direction + 180}deg)` }} aria-hidden="true" />
              </span>
              <span className="font-mono text-[11px] font-semibold text-cyan-300">→ {compass(weather.direction + 180)}</span>
            </div>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-2">
            <Stat icon={Wind} label="Gusts" value={String(Math.round(weather.gusts))} unit="km/h" />
            <Stat icon={ArrowUp} label="Flowing Toward" value={`${Math.round((weather.direction + 180) % 360)}°`} unit={compass(weather.direction + 180)} />
            <Stat icon={Gauge} label="Pressure" value={weather.pressure.toFixed(0)} unit="hPa" />
            <Stat icon={Thermometer} label="Temp" value={weather.temperature.toFixed(1)} unit="°C" />
          </dl>
        </>
      )}
    </section>
  )
}
