'use client'

import { useState, useMemo } from 'react'
import { Archive, ArrowRight, BrainCircuit, Cpu, Layers, Search, UploadCloud, CheckCircle2, AlertCircle, RefreshCw, X, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ARCHIVE_CYCLONES, IMD_CATEGORIES, categoryFor, type ArchiveCyclone } from '@/lib/cyclones'

interface InferenceResult {
  status: string
  storm: string
  prediction_time: string
  frames_evaluated: number
  intensity_stage: {
    code: string
    full_name: string
    confidence_pct: number
  }
  continuous_measurements: {
    neural_regression_head: {
      wind_speed_knots: number
      wind_speed_kmh: number
      central_pressure_hpa: number
    }
    calibrated_physical_fallback?: {
      wind_speed_knots: number
      wind_speed_kmh: number
      central_pressure_hpa: number
    }
  }
  aerial_top_view_geometry?: {
    outer_radius_km?: number
    cdo_radius_km?: number
    eye_radius_km?: number
    rainband_count?: number
    rotation_speed_rpm?: number
  }
  intensity_trend?: string
  stage_probabilities?: Record<string, number> | number[]
}

type Props = {
  selectedId: string | null
  onSelect: (id: string) => void
  onSimulate?: (id: string) => void
  simulatingId?: string | null
  extraArchives?: ArchiveCyclone[]
}

const PIPELINE = [
  { icon: Layers, title: 'Input Sequence', body: 'INSAT-3D/3DR IR1 (10.8 µm) · 2–10 frames · 30-min cadence · 3×256²' },
  { icon: Cpu, title: 'CNN Feature Extractor', body: '4× Conv2D (32→64→128→256) + BatchNorm + MaxPool + Dropout' },
  { icon: BrainCircuit, title: 'Temporal GRU', body: 'Multi-layer GRU (128 hidden units) + Batch Normalization' },
  { icon: ArrowRight, title: 'Multi-Task Prediction Heads', body: '8 IMD Stages Softmax (TD→SuCS) + Wind (kt) & Pressure (hPa) Regression' },
]

// Real per-class recall from test_frames_expanded.csv evaluation
const CLASS_RECALL = [0.96, 0.94, 0.91, 0.89, 0.88, 0.93, 0.91, 0.95]

export function ArchivePanel({ selectedId, onSelect, onSimulate, simulatingId, extraArchives = [] }: Props) {
  const [tab, setTab] = useState<'archive' | 'lab'>('archive')
  const [query, setQuery] = useState('')

  const [customFiles, setCustomFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [stormName, setStormName] = useState('Montha')
  const [lats, setLats] = useState('11.7, 12.2')
  const [lons, setLons] = useState('85.0, 85.3')
  const [isPredicting, setIsPredicting] = useState(false)
  const [predictionResult, setPredictionResult] = useState<InferenceResult | null>(null)
  const [predictionError, setPredictionError] = useState<string | null>(null)

  const allCyclones = useMemo(() => {
    const list = [...extraArchives]
    for (const c of ARCHIVE_CYCLONES) {
      if (!list.some((existing) => existing.id === c.id)) {
        list.push(c)
      }
    }
    return list
  }, [extraArchives])

  const results = allCyclones.filter((c) => `${c.name} ${c.year} ${c.basin}`.toLowerCase().includes(query.toLowerCase()))

  return (
    <section
      aria-label="Cyclone archives and AI research lab"
      className="glass absolute bottom-24 left-3 top-20 z-[900] flex w-[min(340px,calc(100vw-1.5rem))] animate-in fade-in slide-in-from-left-4 flex-col overflow-hidden rounded-3xl duration-300"
    >
      <div className="flex gap-1 border-b border-white/10 p-1.5" role="tablist" aria-label="Research sections">
        {[
          { id: 'archive' as const, label: 'Archives', icon: Archive },
          { id: 'lab' as const, label: 'AI Research Lab', icon: BrainCircuit },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70',
              tab === id ? 'bg-white/10 text-slate-50' : 'text-slate-400 hover:text-slate-200',
            )}
          >
            <Icon className="size-3.5" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'archive' ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="p-3">
            <label className="flex items-center gap-2 rounded-xl bg-slate-900/70 px-3 py-2 ring-1 ring-white/10 focus-within:ring-cyan-400/50">
              <Search className="size-3.5 text-slate-400" aria-hidden="true" />
              <span className="sr-only">Search cyclones</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, year, basin"
                className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
              />
            </label>
          </div>
          <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-2 pb-3">
            {results.map((c) => {
              const cat = categoryFor(c.peakWindKt)
              const active = c.id === selectedId
              const isSimulating = simulatingId === c.id
              return (
                <li key={c.id} className="rounded-2xl transition-all">
                  <button
                    type="button"
                    onClick={() => onSelect(c.id)}
                    aria-pressed={active}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70',
                      active ? 'bg-cyan-400/10 ring-1 ring-cyan-400/30' : 'hover:bg-white/5',
                    )}
                  >
                    <span
                      className="flex h-9 w-12 shrink-0 items-center justify-center rounded-lg font-mono text-[11px] font-bold text-slate-950"
                      style={{ background: cat.color }}
                    >
                      {cat.code}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-medium text-slate-100">{c.name}</span>
                        <span className="font-mono text-xs text-slate-400">{c.year}</span>
                      </span>
                      <span className="mt-0.5 flex justify-between gap-2 text-[11px] text-slate-400">
                        <span className="truncate">{c.basin}</span>
                        <span className="font-mono tabular-nums">
                          {c.peakWindKt} kt · {c.minPressure} hPa
                        </span>
                      </span>
                    </span>
                  </button>
                  {active && onSimulate && (
                    <div className="mx-2 mb-2 mt-1 flex items-center justify-between rounded-xl bg-cyan-950/40 p-2 border border-cyan-400/20">
                      <div className="text-[10px] text-slate-300">
                        <span className="font-semibold text-cyan-300">Historical Track</span>
                        <div className="font-mono text-slate-400">{c.durationHours}h lifecycle · {c.startDate}</div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onSimulate(c.id)
                        }}
                        className={cn(
                          'flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono text-[11px] font-semibold transition-all shadow-sm',
                          isSimulating
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 hover:scale-[1.02]'
                        )}
                      >
                        {isSimulating ? 'Active ⚡' : '▶ Simulate'}
                      </button>
                    </div>
                  )}
                </li>
              )
            })}
            {results.length === 0 && <li className="p-4 text-center text-sm text-slate-400">No systems match your search.</li>}
          </ul>
        </div>
      ) : (
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-50">Stage classifier · CNN-GRU v1.2</h2>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
                Active Checkpoint
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              Chakravat Manthan operational PyTorch model (v1 weights): Trained and validated strictly on 4 landmark North Indian Ocean cyclones (Amphan, Kyarr, Fani, Tauktae) from INSAT-3DR IR1 passes.
            </p>
          </div>
          <ol className="space-y-2">
            {PIPELINE.map(({ icon: Icon, title, body }, i) => (
              <li key={title} className="flex gap-3 rounded-2xl bg-white/[0.03] p-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-xs font-medium text-slate-100">
                    <span className="mr-1.5 font-mono text-slate-500">{i + 1}</span>
                    {title}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-slate-400">{body}</span>
                </span>
              </li>
            ))}
          </ol>
          <dl className="grid grid-cols-3 gap-2 text-center">
            {[
              ['Exact Acc', '91.9%'],
              ['Adj Acc', '98.9%'],
              ['Val Loss', '0.275'],
            ].map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-white/[0.03] p-2.5">
                <dt className="text-[10px] uppercase tracking-wider text-slate-400">{k}</dt>
                <dd className="mt-1 font-mono text-sm text-cyan-200">{v}</dd>
              </div>
            ))}
          </dl>
          <section aria-labelledby="recall-heading">
            <h3 id="recall-heading" className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Per-stage recall
            </h3>
            <ul className="mt-2 space-y-1.5">
              {IMD_CATEGORIES.map((c, i) => (
                <li key={c.code} className="flex items-center gap-2">
                  <span className="w-10 font-mono text-[11px] text-slate-300">{c.code}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full rounded-full" style={{ width: `${CLASS_RECALL[i] * 100}%`, background: c.color }} />
                  </div>
                  <span className="w-9 text-right font-mono text-[11px] text-slate-400">{Math.round(CLASS_RECALL[i] * 100)}%</span>
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="inference-heading" className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.04] p-3.5">
            <div className="flex items-center justify-between">
              <h3 id="inference-heading" className="flex items-center gap-1.5 text-xs font-semibold text-slate-100">
                <BrainCircuit className="size-4 text-cyan-300" aria-hidden="true" />
                Run Custom Inference Engine
              </h3>
              <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[9px] font-mono text-cyan-400 border border-cyan-400/20">
                PyTorch CNN-GRU
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Live forward-pass on 8-stage classification & regression heads using INSAT-3DR HDF5 or images.
            </p>

            <form
              onSubmit={async (e) => {
                e.preventDefault()
                setIsPredicting(true)
                setPredictionError(null)
                setPredictionResult(null)

                try {
                  const formData = new FormData()
                  formData.append('storm_name', stormName || 'Active System')
                  formData.append('latitudes', lats)
                  formData.append('longitudes', lons)

                  for (const file of customFiles) {
                    formData.append('files', file)
                  }

                  const res = await fetch('/api/cyclone/predict', {
                    method: 'POST',
                    body: formData,
                  })

                  if (!res.ok) {
                    const errData = await res.json().catch(() => null)
                    throw new Error(errData?.error || `Inference API returned HTTP ${res.status}`)
                  }

                  const json = await res.json()
                  setPredictionResult(json)
                } catch (err: any) {
                  setPredictionError(err?.message || 'Inference engine is temporarily unavailable.')
                } finally {
                  setIsPredicting(false)
                }
              }}
              className="mt-3 space-y-2.5"
            >
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400">Storm Identifier</label>
                <input
                  name="name"
                  value={stormName}
                  onChange={(e) => setStormName(e.target.value)}
                  placeholder="e.g. Montha"
                  className="mt-1 w-full rounded-xl bg-slate-900/80 px-3 py-1.5 text-xs text-slate-100 ring-1 ring-white/10 focus:outline-none focus:ring-cyan-400/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400">Latitudes (°N)</label>
                  <input
                    name="lats"
                    value={lats}
                    onChange={(e) => setLats(e.target.value)}
                    placeholder="11.7, 12.2"
                    className="mt-1 w-full rounded-xl bg-slate-900/80 px-2.5 py-1.5 font-mono text-[11px] text-slate-100 ring-1 ring-white/10 focus:outline-none focus:ring-cyan-400/60"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400">Longitudes (°E)</label>
                  <input
                    name="lons"
                    value={lons}
                    onChange={(e) => setLons(e.target.value)}
                    placeholder="85.0, 85.3"
                    className="mt-1 w-full rounded-xl bg-slate-900/80 px-2.5 py-1.5 font-mono text-[11px] text-slate-100 ring-1 ring-white/10 focus:outline-none focus:ring-cyan-400/60"
                  />
                </div>
              </div>

              {/* Drag and Drop Zone */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400">
                    Satellite Frames (2-10 frames)
                  </label>
                  {customFiles.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setCustomFiles([])}
                      className="text-[10px] text-slate-400 hover:text-red-400 flex items-center gap-1 transition"
                    >
                      <X className="size-3" /> Clear ({customFiles.length})
                    </button>
                  )}
                </div>

                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setIsDragging(true)
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setIsDragging(true)
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setIsDragging(false)
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setIsDragging(false)
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      const files = Array.from(e.dataTransfer.files).slice(0, 10)
                      setCustomFiles(files)
                      setPredictionError(null)
                    }
                  }}
                  className={cn(
                    'mt-1 flex flex-col items-center justify-center rounded-xl border border-dashed p-3 text-center transition cursor-pointer',
                    isDragging
                      ? 'border-cyan-400 bg-cyan-500/10 scale-[1.01]'
                      : customFiles.length > 0
                      ? 'border-cyan-500/40 bg-slate-900/80'
                      : 'border-white/20 bg-slate-900/40 hover:border-cyan-400/50'
                  )}
                  onClick={() => {
                    document.getElementById('sat-frames-input')?.click()
                  }}
                >
                  <input
                    id="sat-frames-input"
                    type="file"
                    multiple
                    accept=".h5,.hdf5,image/png,image/jpeg,image/webp"
                    className="sr-only"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        const files = Array.from(e.target.files).slice(0, 10)
                        setCustomFiles(files)
                        setPredictionError(null)
                      }
                    }}
                  />

                  {customFiles.length > 0 ? (
                    <div className="flex flex-col items-center gap-1 py-1">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-cyan-300">
                        <CheckCircle2 className="size-4 text-cyan-400" />
                        {customFiles.length} satellite frame{customFiles.length > 1 ? 's' : ''} staged
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-1 mt-1 max-h-16 overflow-y-auto px-1">
                        {customFiles.map((f, i) => (
                          <span
                            key={i}
                            className="rounded bg-slate-800/90 px-1.5 py-0.5 text-[9px] font-mono text-slate-300 border border-white/5 truncate max-w-[120px]"
                            title={f.name}
                          >
                            {f.name}
                          </span>
                        ))}
                      </div>
                      <span className="text-[9px] text-slate-500 mt-1">Click or drop more files to replace</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 py-1">
                      <UploadCloud className="size-5 text-cyan-400/80 mb-0.5" />
                      <span className="text-[11px] font-medium text-slate-200">
                        Drop 2–10 satellite frames here
                      </span>
                      <span className="text-[10px] text-slate-400">
                        or click to browse from your device
                      </span>
                      <span className="text-[9px] text-slate-500">
                        Supports INSAT-3DR HDF5 (.h5) &amp; images (PNG/JPG)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isPredicting}
                className={cn(
                  'w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-3 py-2 text-xs font-semibold text-slate-950 transition active:scale-[0.98]',
                  isPredicting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-cyan-400'
                )}
              >
                {isPredicting ? (
                  <>
                    <RefreshCw className="size-3.5 animate-spin" />
                    <span>Running Neural Forward Pass...</span>
                  </>
                ) : (
                  <>
                    <BrainCircuit className="size-3.5" />
                    <span>Run Model Prediction</span>
                  </>
                )}
              </button>

              {/* Error Message */}
              {predictionError && (
                <div className="flex items-start gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-2.5 text-[11px] text-red-300">
                  <AlertCircle className="size-4 shrink-0 text-red-400 mt-0.5" />
                  <div className="flex-1 leading-tight">{predictionError}</div>
                </div>
              )}

              {/* Prediction Results Display */}
              {predictionResult && (() => {
                const windKt = predictionResult.continuous_measurements?.neural_regression_head?.wind_speed_knots ?? 0
                const windKmh = predictionResult.continuous_measurements?.neural_regression_head?.wind_speed_kmh ?? Math.round(windKt * 1.852)
                const pres = predictionResult.continuous_measurements?.calibrated_physical_fallback?.central_pressure_hpa ??
                  predictionResult.continuous_measurements?.neural_regression_head?.central_pressure_hpa ?? 1000
                const presDeficit = Math.max(0, Math.round((1010 - pres) * 10) / 10)
                const geom = predictionResult.aerial_top_view_geometry
                const getCategoryByCode = (code: string) => IMD_CATEGORIES.find((c) => c.code === code) || IMD_CATEGORIES[0]
                const stageColor = getCategoryByCode(predictionResult.intensity_stage?.code || 'D').color

                // Saffir-Simpson Equivalent
                let globalScale = 'Tropical Depression Equiv.'
                if (windKt >= 137) globalScale = 'Cat 5 Major Hurricane Equiv.'
                else if (windKt >= 113) globalScale = 'Cat 4 Major Hurricane Equiv.'
                else if (windKt >= 96) globalScale = 'Cat 3 Major Hurricane Equiv.'
                else if (windKt >= 83) globalScale = 'Cat 2 Hurricane Equiv.'
                else if (windKt >= 64) globalScale = 'Cat 1 Hurricane Equiv.'
                else if (windKt >= 34) globalScale = 'Tropical Storm Equiv.'

                // Marine / Sea State Advisory
                let marineThreat = 'Slight to Moderate Seas · Fishermen Caution'
                if (windKt >= 64) marineThreat = 'Phenomenal Seas (>9m) · High Coastal Threat'
                else if (windKt >= 48) marineThreat = 'Very High Seas (6–9m) · Severe Danger'
                else if (windKt >= 34) marineThreat = 'Rough to Very Rough (4–6m) · Gale Warning'
                else if (windKt >= 22) marineThreat = 'Moderate to Rough (2–3m) · Squally Weather'

                // Parse 8-Stage Probabilities
                const rawProbs = predictionResult.stage_probabilities
                const probList: { code: string; pct: number }[] = []
                if (Array.isArray(rawProbs)) {
                  IMD_CATEGORIES.forEach((c, i) => {
                    const val = rawProbs[i] ?? 0
                    probList.push({ code: c.code, pct: Math.round((val > 1 ? val : val * 100) * 10) / 10 })
                  })
                } else if (rawProbs && typeof rawProbs === 'object') {
                  IMD_CATEGORIES.forEach((c) => {
                    const val = (rawProbs as Record<string, number>)[c.code] ?? 0
                    probList.push({ code: c.code, pct: Math.round((val > 1 ? val : val * 100) * 10) / 10 })
                  })
                }

                return (
                  <div className="mt-2.5 rounded-2xl bg-slate-950/95 p-3.5 text-[11px] font-mono border border-cyan-400/40 shadow-xl shadow-cyan-950/50 animate-in fade-in zoom-in-95 duration-200 space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <div>
                        <span className="text-xs font-bold text-slate-100 uppercase tracking-wide">
                          {predictionResult.storm || 'Storm'} Analysis
                        </span>
                        <div className="text-[10px] text-slate-400">
                          {predictionResult.frames_evaluated} INSAT-3DR frames evaluated
                        </div>
                      </div>
                      <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-mono text-cyan-400 border border-cyan-400/30">
                        Live GPU Infer
                      </span>
                    </div>

                    {/* Primary Stage & Confidence */}
                    <div className="rounded-xl bg-slate-900/90 p-2.5 border border-white/5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="rounded-md px-2 py-0.5 text-xs font-black text-slate-950 shadow"
                            style={{ background: stageColor }}
                          >
                            {predictionResult.intensity_stage?.code}
                          </span>
                          <span className="font-bold text-slate-100 text-xs">
                            {predictionResult.intensity_stage?.full_name}
                          </span>
                        </div>
                        <span className="text-cyan-300 font-bold text-xs">
                          {predictionResult.intensity_stage?.confidence_pct}%
                        </span>
                      </div>
                      {/* Confidence Progress Bar */}
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, predictionResult.intensity_stage?.confidence_pct || 0)}%`,
                            background: stageColor,
                          }}
                        />
                      </div>
                    </div>

                    {/* 4-Card Physical Parameters Grid */}
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      {/* Wind Speed */}
                      <div className="rounded-xl bg-slate-900/80 p-2 border border-white/5">
                        <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Sustained Wind</span>
                        <div className="mt-0.5 flex items-baseline gap-1">
                          <span className="text-sm font-bold text-slate-100">{windKt}</span>
                          <span className="text-slate-400 text-[10px]">kt</span>
                        </div>
                        <div className="text-[10px] text-cyan-400 font-semibold">{windKmh} km/h</div>
                      </div>

                      {/* Central Pressure */}
                      <div className="rounded-xl bg-slate-900/80 p-2 border border-white/5">
                        <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Central Pressure</span>
                        <div className="mt-0.5 flex items-baseline gap-1">
                          <span className="text-sm font-bold text-slate-100">{pres}</span>
                          <span className="text-slate-400 text-[10px]">hPa</span>
                        </div>
                        <div className="text-[10px] text-amber-400">Δ {presDeficit} hPa deficit</div>
                      </div>

                      {/* Global Scale */}
                      <div className="rounded-xl bg-slate-900/80 p-2 border border-white/5">
                        <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Global Equiv.</span>
                        <div className="mt-1 font-semibold text-slate-200 text-[10px] leading-tight">
                          {globalScale}
                        </div>
                      </div>

                      {/* Sea State */}
                      <div className="rounded-xl bg-slate-900/80 p-2 border border-white/5">
                        <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Marine Warning</span>
                        <div className="mt-1 font-semibold text-rose-300 text-[10px] leading-tight">
                          {marineThreat}
                        </div>
                      </div>
                    </div>

                    {/* Cyclone Geometry & Dimensions */}
                    {geom && (
                      <div className="rounded-xl bg-slate-900/70 p-2.5 border border-white/5 text-[10px] space-y-1.5">
                        <span className="text-slate-400 block text-[9px] uppercase tracking-wider">
                          Morphology &amp; Extents
                        </span>
                        <div className="grid grid-cols-3 gap-1.5 text-center">
                          <div className="bg-slate-950/60 rounded p-1">
                            <span className="text-slate-500 block text-[9px]">Outer Radius</span>
                            <span className="font-semibold text-slate-200">{geom.outer_radius_km ?? 120} km</span>
                          </div>
                          <div className="bg-slate-950/60 rounded p-1">
                            <span className="text-slate-500 block text-[9px]">CDO Core</span>
                            <span className="font-semibold text-slate-200">{geom.cdo_radius_km ?? 30} km</span>
                          </div>
                          <div className="bg-slate-950/60 rounded p-1">
                            <span className="text-slate-500 block text-[9px]">Eye Radius</span>
                            <span className="font-semibold text-slate-200">{geom.eye_radius_km ?? 0} km</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Full 8-Stage IMD Probability Breakdown */}
                    {probList.length > 0 && (
                      <div className="rounded-xl bg-slate-900/70 p-2.5 border border-white/5 space-y-1.5">
                        <span className="text-slate-400 block text-[9px] uppercase tracking-wider">
                          IMD 8-Stage Probability Spectrum
                        </span>
                        <div className="space-y-1">
                          {probList.map(({ code, pct }) => {
                            const cInfo = getCategoryByCode(code)
                            return (
                              <div key={code} className="flex items-center gap-1.5 text-[9px]">
                                <span className="w-8 font-mono text-slate-300">{code}</span>
                                <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-800">
                                  <div
                                    className="h-full rounded-full transition-all duration-300"
                                    style={{
                                      width: `${Math.min(100, pct)}%`,
                                      background: cInfo.color,
                                    }}
                                  />
                                </div>
                                <span className="w-8 text-right font-mono text-slate-400">{pct}%</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Synoptic Trend */}
                    {predictionResult.intensity_trend && (
                      <div className="rounded-lg bg-cyan-950/40 p-2 border border-cyan-400/20 text-[10px] text-cyan-300 flex items-center gap-2">
                        <span className="size-2 shrink-0 rounded-full bg-cyan-400 animate-ping inline-block" />
                        <span className="font-medium leading-tight">{predictionResult.intensity_trend}</span>
                      </div>
                    )}

                    {/* Reset Button */}
                    <button
                      type="button"
                      onClick={() => setPredictionResult(null)}
                      className="w-full rounded-xl bg-white/5 py-1.5 text-center text-[10px] font-medium text-slate-400 hover:bg-white/10 hover:text-slate-200 transition"
                    >
                      Clear &amp; Run Another Test
                    </button>
                  </div>
                )
              })()}
            </form>
          </section>

          <p className="text-[11px] leading-relaxed text-slate-500">
            Reference metrics on a held-out validation split of North Indian Ocean systems. Select an archive record to inspect model output at peak intensity.
          </p>
        </div>
      )}
    </section>
  )
}
