'use client'

import { BrainCircuit, Gauge, Navigation, ShieldAlert, Wind, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { IMD_CATEGORIES, IMD_WARNING_STAGES, categoryFor, compass, formatCoords, stageProbabilities } from '@/lib/cyclones'

export type CyclonePanelData = {
  kind: 'active' | 'archive'
  name: string
  subtitle: string
  windKt: number
  pressure: number
  lat: number
  lon: number
  headingDeg: number | null
  speedKmh: number | null
  warningIndex: number
  warningNote: string
  series: number[]
  seriesIndex: number
  landfall: string
  customProbabilities?: { code: string; color: string; p: number }[]
  geometry?: {
    outerRadiusKm: number
    cdoRadiusKm: number
    eyeRadiusKm: number
  }
}

type Props = {
  open: boolean
  data: CyclonePanelData | null
  onClose: () => void
}

function IntensitySparkline({ series, index }: { series: number[]; index: number }) {
  if (series.length < 2) return null
  const w = 320
  const h = 64
  const max = Math.max(140, ...series)
  const x = (i: number) => (i / (series.length - 1)) * w
  const y = (v: number) => h - (v / max) * (h - 6) - 3
  const points = series.map((v, i) => `${x(i)},${y(v)}`).join(' ')
  const clamped = Math.min(series.length - 1, Math.max(0, index))
  const ix = x(clamped)
  const iv = series[Math.floor(clamped)] + (series[Math.ceil(clamped)] - series[Math.floor(clamped)]) * (clamped % 1)
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-16 w-full" role="img" aria-label="Intensity trend along track">
      {IMD_CATEGORIES.slice(2).map((c) => (
        <line key={c.code} x1={0} x2={w} y1={y(c.minKt)} y2={y(c.minKt)} stroke={c.color} strokeOpacity={0.18} strokeDasharray="2 4" />
      ))}
      <polyline points={points} fill="none" stroke="#e2e8f0" strokeWidth={1.6} strokeLinejoin="round" />
      <line x1={ix} x2={ix} y1={0} y2={h} stroke="#67e8f9" strokeOpacity={0.5} />
      <circle cx={ix} cy={y(iv)} r={4} fill="#67e8f9" className="drop-shadow-[0_0_6px_rgba(103,232,249,0.9)]" />
    </svg>
  )
}

export function CyclonePanel({ open, data, onClose }: Props) {
  const cat = data ? categoryFor(data.windKt) : null
  const probs = data?.customProbabilities ?? (data ? stageProbabilities(data.windKt) : [])
  const top = probs.reduce((a, b) => (b.p > (a?.p ?? 0) ? b : a), probs[0])

  return (
    <aside
      aria-label="Cyclone analytics"
      aria-hidden={!open}
      inert={!open}
      className={cn(
        'glass absolute bottom-3 right-3 top-20 z-[1100] flex w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-3xl transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:w-[380px]',
        open ? 'translate-x-0' : 'translate-x-[calc(100%+1.5rem)]',
      )}
    >
      {data && cat && (
        <>
          <div className="relative overflow-hidden border-b border-white/10 p-5">
            <div
              className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full opacity-30 blur-3xl"
              style={{ background: cat.color }}
              aria-hidden="true"
            />
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400">
                  {data.kind === 'active' ? (
                    <>
                      <span className="size-1.5 animate-pulse rounded-full bg-red-400" aria-hidden="true" />
                      Active system
                    </>
                  ) : (
                    'Archive record'
                  )}
                </p>
                <h2 className="mt-1 text-3xl font-semibold tracking-tight text-slate-50">{data.name}</h2>
                <p className="mt-0.5 text-xs text-slate-400">{data.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1.5 text-slate-400 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
                aria-label="Close cyclone analytics"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
            <div className="relative mt-4 flex items-center gap-2">
              <span
                className="rounded-md px-2 py-1 font-mono text-xs font-bold text-slate-950"
                style={{ background: cat.color, boxShadow: `0 0 16px -2px ${cat.color}` }}
              >
                {cat.code}
              </span>
              <span className="text-sm text-slate-200">{cat.name}</span>
            </div>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            <dl className="grid grid-cols-2 gap-2.5">
              <div className="clay-card col-span-2 p-3.5">
                <dt className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-cyan-300/80">
                  <Wind className="size-3" aria-hidden="true" />
                  Max sustained wind
                </dt>
                <dd className="mt-1 flex items-baseline gap-3 font-mono tabular-nums">
                  <span className="text-3xl font-light text-slate-50">
                    {Math.round(data.windKt)}
                    <span className="ml-1 text-sm text-slate-400">kt</span>
                  </span>
                  <span className="text-lg text-cyan-200">
                    {Math.round(data.windKt * 1.852)}
                    <span className="ml-1 text-xs text-slate-400">km/h</span>
                  </span>
                </dd>
              </div>
              <div className="clay-card p-3.5">
                <dt className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-cyan-300/80">
                  <Gauge className="size-3" aria-hidden="true" />
                  Central pressure
                </dt>
                <dd className="mt-1 font-mono text-xl tabular-nums text-slate-50">
                  {data.pressure}
                  <span className="ml-1 text-xs text-slate-400">hPa</span>
                </dd>
              </div>
              <div className="clay-card p-3.5">
                <dt className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-cyan-300/80">
                  <Navigation className="size-3" aria-hidden="true" />
                  {data.headingDeg !== null ? 'Movement' : 'Position'}
                </dt>
                <dd className="mt-1 font-mono text-sm tabular-nums text-slate-50">
                  {data.headingDeg !== null && data.speedKmh !== null ? (
                    <>
                      {compass(data.headingDeg)} · {Math.round(data.speedKmh)}
                      <span className="ml-1 text-xs text-slate-400">km/h</span>
                    </>
                  ) : (
                    formatCoords(data.lat, data.lon)
                  )}
                </dd>
                {data.headingDeg !== null && (
                  <p className="mt-0.5 font-mono text-[11px] text-slate-400">
                    {formatCoords(data.lat, data.lon)}
                  </p>
                )}
              </div>
            </dl>

            {data.geometry && (
              <section aria-labelledby="geometry-heading" className="rounded-2xl border border-white/10 bg-white/[0.02] p-3.5">
                <div className="flex items-center justify-between">
                  <h3 id="geometry-heading" className="text-[11px] font-medium uppercase tracking-wider text-slate-300">
                    Cyclone Dimensions & Swath
                  </h3>
                  <span className="font-mono text-[10px] text-cyan-400">MOSDAC / PyTorch Geometry</span>
                </div>
                <div className="mt-2.5 grid grid-cols-3 gap-1.5 text-center">
                  <div className="flex flex-col justify-between rounded-xl bg-slate-900/60 p-2 min-w-0">
                    <span className="block text-[9px] uppercase tracking-wider text-slate-400 truncate">Total Width</span>
                    <span className="mt-1 font-mono text-xs sm:text-sm font-semibold text-slate-100 truncate">
                      {data.geometry.outerRadiusKm * 2} <span className="text-[10px] font-normal text-slate-400">km</span>
                    </span>
                  </div>
                  <div className="flex flex-col justify-between rounded-xl bg-slate-900/60 p-2 min-w-0">
                    <span className="block text-[9px] uppercase tracking-wider text-amber-300/80 truncate">CDO Core</span>
                    <span className="mt-1 font-mono text-xs sm:text-sm font-semibold text-amber-200 truncate">
                      {data.geometry.cdoRadiusKm * 2} <span className="text-[10px] font-normal text-slate-400">km</span>
                    </span>
                  </div>
                  <div className="flex flex-col justify-between rounded-xl bg-slate-900/60 p-2 min-w-0">
                    <span className="block text-[9px] uppercase tracking-wider text-cyan-300/80 truncate">Eye Width</span>
                    <span className="mt-1 font-mono text-xs sm:text-sm font-semibold text-cyan-200">
                      {data.geometry.eyeRadiusKm > 0 ? (
                        <>
                          {data.geometry.eyeRadiusKm * 2} <span className="text-[10px] font-normal text-slate-400">km</span>
                        </>
                      ) : (
                        <>
                          0 <span className="text-[10px] font-normal text-slate-400">km</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-[10px] leading-relaxed text-slate-400">
                  Outer radius represents gale-force convective shield (R34). Orange/cyan concentric swaths on the map illustrate real-time radius of impact.
                </p>
              </section>
            )}

            <section aria-labelledby="intensity-heading">
              <h3 id="intensity-heading" className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Intensity along track
              </h3>
              <IntensitySparkline series={data.series} index={data.seriesIndex} />
            </section>

            <section aria-labelledby="ai-heading" className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.03] p-3.5">
              <div className="flex items-center justify-between">
                <h3 id="ai-heading" className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-cyan-200">
                  <BrainCircuit className="size-3.5" aria-hidden="true" />
                  AI stage probability
                </h3>
                <span className="font-mono text-[10px] text-slate-400">CNN-GRU · IR seq ×8</span>
              </div>
              <ul className="mt-3 space-y-1.5">
                {probs.map((p) => (
                  <li key={p.code} className="flex items-center gap-2">
                    <span className={cn('w-10 font-mono text-[11px]', p.code === top?.code ? 'text-slate-50' : 'text-slate-400')}>{p.code}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800/80">
                      <div
                        className="h-full rounded-full transition-[width] duration-500"
                        style={{
                          width: `${Math.max(1, p.p * 100)}%`,
                          background: p.color,
                          boxShadow: p.code === top?.code ? `0 0 10px ${p.color}` : undefined,
                          opacity: p.code === top?.code ? 1 : 0.55,
                        }}
                      />
                    </div>
                    <span className="w-11 text-right font-mono text-[11px] tabular-nums text-slate-300">{(p.p * 100).toFixed(1)}%</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
                Predicted stage <span className="font-mono text-slate-100">{top?.code}</span> with{' '}
                <span className="font-mono text-cyan-200">{((top?.p ?? 0) * 100).toFixed(0)}%</span> confidence.
              </p>
            </section>

            <section aria-labelledby="warning-heading">
              <h3 id="warning-heading" className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                <ShieldAlert className="size-3.5" aria-hidden="true" />
                IMD warning scale
              </h3>
              <ol className="mt-3 grid grid-cols-4 gap-1.5">
                {IMD_WARNING_STAGES.map((stage, i) => {
                  const active = i === data.warningIndex
                  const passed = i < data.warningIndex
                  return (
                    <li key={stage.key} className="flex flex-col gap-1.5">
                      <span
                        className="h-1.5 rounded-full transition-all"
                        style={{
                          background: active || passed ? stage.color : 'rgb(51 65 85 / 0.6)',
                          opacity: passed ? 0.45 : 1,
                          boxShadow: active ? `0 0 12px ${stage.color}` : undefined,
                        }}
                      />
                      <span className={cn('text-[10px] leading-tight', active ? 'font-medium text-slate-50' : 'text-slate-500')}>{stage.label}</span>
                      <span className="font-mono text-[10px] text-slate-500">T−{stage.lead}</span>
                    </li>
                  )
                })}
              </ol>
              <p className="mt-3 rounded-xl bg-white/[0.03] p-2.5 text-xs leading-relaxed text-slate-300">{data.warningNote}</p>
              <p className="mt-2 text-[11px] text-slate-400">
                Landfall: <span className="text-slate-200">{data.landfall}</span>
              </p>
            </section>
          </div>
        </>
      )}
    </aside>
  )
}
