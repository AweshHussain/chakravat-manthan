'use client'

import {
  BrainCircuit,
  Cpu,
  Database,
  Globe2,
  Layers,
  Radio,
  Satellite,
  ShieldCheck,
  Sparkles,
  Wind,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  open: boolean
  onClose: () => void
}

const DATA_RESEARCH_SOURCES = [
  {
    id: 'isro',
    name: 'ISRO MOSDAC / INSAT-3DR',
    fullTitle: 'Space Applications Centre · Multi-Spectral L1C Geostationary Imager',
    logo: '/sources/isro_mosdac.png',
    accent: 'hover:border-emerald-400/60 hover:shadow-[0_0_20px_rgba(52,211,153,0.25)]',
    dividerColor: 'bg-emerald-400/50',
  },
  {
    id: 'imd',
    name: 'IMD',
    fullTitle: 'India Meteorological Department · Ministry of Earth Sciences',
    logo: '/sources/imd.png',
    accent: 'hover:border-amber-400/60 hover:shadow-[0_0_20px_rgba(251,191,36,0.25)]',
    dividerColor: 'bg-amber-400/50',
  },
  {
    id: 'noaa',
    name: 'NOAA IBTrACS',
    fullTitle: 'International Best Track Archive for Climate Stewardship',
    logo: '/sources/noaa.png',
    accent: 'hover:border-cyan-400/60 hover:shadow-[0_0_20px_rgba(34,211,238,0.25)]',
    dividerColor: 'bg-cyan-400/50',
  },
  {
    id: 'nasa',
    name: 'NASA GIBS',
    fullTitle: 'Global Imagery Browse Services · Near Real-Time Earth Observation',
    logo: '/sources/nasa.png',
    accent: 'hover:border-sky-400/60 hover:shadow-[0_0_20px_rgba(56,189,248,0.25)]',
    dividerColor: 'bg-sky-400/50',
  },
]

const SYSTEM_PILLARS = [
  {
    icon: Satellite,
    title: 'ISRO MOSDAC Satellite Ingestion',
    color: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    glow: 'group-hover:border-amber-400/70 group-hover:shadow-[0_0_24px_rgba(251,191,36,0.35)]',
    tagColor: 'text-amber-300',
    description:
      'Direct payload ingestion from INSAT-3D/3DR TIR-1 (10.8 µm) thermal infrared imagery over the North Indian Ocean basin, Arabian Sea, and Bay of Bengal.',
  },
  {
    icon: Database,
    title: 'Decoupled Two-Database Architecture',
    color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    glow: 'group-hover:border-blue-400/70 group-hover:shadow-[0_0_24px_rgba(96,165,250,0.35)]',
    tagColor: 'text-blue-300',
    description:
      'Private Ingestion Buffer (DB 1) guarantees zero-drop payload persistence, while Public Telemetry (DB 2) feeds the real-time Vercel Edge frontend via WebSockets.',
  },
  {
    icon: BrainCircuit,
    title: 'PyTorch 4-Stage CNN + 2-Layer GRU',
    color: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    glow: 'group-hover:border-purple-400/70 group-hover:shadow-[0_0_24px_rgba(192,132,252,0.35)]',
    tagColor: 'text-purple-300',
    description:
      'Custom multi-task spatio-temporal deep neural network classifying 8 IMD cyclone stages (TD → SuCS) with simultaneous regression of sustained wind (kt) and central pressure (hPa).',
  },
  {
    icon: Wind,
    title: 'Rankine & Holland Vortex Physics',
    color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
    glow: 'group-hover:border-cyan-400/70 group-hover:shadow-[0_0_24px_rgba(34,211,238,0.4)]',
    tagColor: 'text-cyan-300',
    description:
      'Continuous 3D atmospheric particle vectors dynamically coupled to neural cyclone coordinates, estimating gale-force convective swath (R34), CDO core, and eye diameter.',
  },
]

export function AboutModal({ open, onClose }: Props) {
  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-title"
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200"
    >
      {/* Centered Modal Card with visible live map background preserved */}
      <div className="glass relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/15 p-0 shadow-2xl text-slate-100 animate-in zoom-in-95 duration-200">
        
        {/* Header Banner */}
        <div className="relative border-b border-white/10 px-6 py-5 bg-gradient-to-b from-slate-900/90 to-slate-950/70">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="relative flex size-11 shrink-0 items-center justify-center rounded-full overflow-hidden shadow-[0_0_20px_-2px_rgba(34,211,238,0.55)] bg-slate-950 border border-cyan-400/50">
                <img
                  src="/logo.png"
                  alt="Chakravat Manthan Logo"
                  width={44}
                  height={44}
                  className="size-full object-contain animate-[spin_12s_linear_infinite]"
                  loading="eager"
                  onError={(e) => {
                    const target = e.currentTarget
                    target.style.display = 'none'
                    const parent = target.parentElement
                    if (parent && !parent.querySelector('.cm-fallback-icon')) {
                      const fallback = document.createElement('div')
                      fallback.className = 'cm-fallback-icon flex size-full items-center justify-center text-cyan-300 font-bold text-sm bg-gradient-to-tr from-cyan-600 to-blue-500 rounded-full'
                      fallback.innerText = 'CM'
                      parent.appendChild(fallback)
                    }
                  }}
                />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 id="about-title" className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                    Chakravat <span className="text-cyan-300">Manthan</span>
                  </h2>
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)]">
                    <Sparkles className="size-3 text-amber-300" />
                    Built for SIH
                  </span>
                </div>
                <p className="text-[11px] font-mono tracking-wider uppercase text-cyan-400/90 font-medium mt-0.5">
                  Meteorological Intelligence & Space Technology Platform
                </p>
              </div>
            </div>

            {/* Cut / Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close about modal"
              className="flex size-8 items-center justify-center rounded-full bg-white/[0.08] text-slate-400 hover:bg-white/20 hover:text-white transition active:scale-95 border border-white/10"
            >
              <X className="size-4" />
            </button>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-300">
            Next-generation operational deep learning intelligence platform for tropical cyclogenesis detection, real-time satellite intensity tracking, and interactive historical storm simulation over the North Indian Ocean basin.
          </p>
        </div>

        {/* Scrollable Content Body with Smooth Scrolling */}
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5 smooth-scroll custom-modal-scrollbar">
          
          {/* Section 1: Technical Architecture & Working */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Cpu className="size-4 text-cyan-300" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                System Architecture & Working
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {SYSTEM_PILLARS.map((pillar) => {
                const Icon = pillar.icon
                return (
                  <div
                    key={pillar.title}
                    className={cn(
                      'group relative clay-card p-3.5 border border-white/10 transition-all duration-300 cursor-pointer overflow-hidden',
                      'hover:-translate-y-1 hover:bg-slate-900/80',
                      pillar.glow,
                    )}
                  >
                    {/* Subtle ambient backlight on hover */}
                    <div className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full bg-white/5 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
                    
                    <div className="relative flex items-center gap-2 mb-1.5">
                      <span className={cn('flex size-6 items-center justify-center rounded-lg border transition-transform duration-300 group-hover:scale-110 shadow-sm', pillar.color)}>
                        <Icon className="size-3.5" />
                      </span>
                      <h4 className={cn('text-xs font-semibold text-slate-100 transition-colors duration-200', `group-hover:${pillar.tagColor}`)}>
                        {pillar.title}
                      </h4>
                    </div>
                    <p className="relative text-[11px] leading-relaxed text-slate-400 group-hover:text-slate-300 transition-colors">
                      {pillar.description}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Section 2: Data, Satellite & Research Sources (4 Logos: ISRO, IMD, NOAA, NASA + Normal text ECMWF/GFS) */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Globe2 className="size-4 text-cyan-300" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                Operational Data & Meteorological Research Sources
              </h3>
            </div>
            
            {/* 2x2 Grid of 4 Official Logos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {DATA_RESEARCH_SOURCES.map((source) => (
                <div
                  key={source.id}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-2xl bg-slate-900/60 border border-white/10 p-3 shadow-md transition-all duration-300 cursor-pointer overflow-hidden',
                    'hover:-translate-y-1 hover:bg-slate-900/90',
                    source.accent,
                  )}
                >
                  {/* Logo Element Box with Hover Animation */}
                  <div className="relative flex size-12 shrink-0 items-center justify-center rounded-xl bg-slate-950 border border-white/10 p-1.5 transition-transform duration-300 group-hover:scale-110 shadow-sm">
                    <img
                      src={source.logo}
                      alt={`${source.name} logo`}
                      className="size-full object-contain filter drop-shadow"
                    />
                  </div>

                  {/* Vertical Divider Line */}
                  <div className={cn('h-8 w-[2px] rounded-full transition-opacity opacity-60 group-hover:opacity-100', source.dividerColor)} />

                  {/* Label & Details */}
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold tracking-wide text-slate-100 group-hover:text-white transition-colors truncate">
                      {source.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 group-hover:text-slate-300 transition-colors truncate">
                      {source.fullTitle}
                    </p>
                  </div>
                </div>
              ))}

              {/* ECMWF & GFS in Normal Text without image logo */}
              <div className="col-span-1 sm:col-span-2 group relative flex items-center gap-3 rounded-2xl bg-slate-900/50 border border-white/10 p-3 shadow-md transition-all duration-300 hover:border-cyan-400/40 hover:bg-slate-900/80">
                <div className="relative flex h-10 px-3 shrink-0 items-center justify-center rounded-xl bg-slate-950 border border-white/10 font-mono text-xs font-bold text-slate-200 shadow-sm">
                  ECMWF & GFS
                </div>
                <div className="h-8 w-[2px] rounded-full bg-slate-600/60 transition-opacity opacity-60 group-hover:opacity-100" />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold tracking-wide text-slate-100 group-hover:text-cyan-200 transition-colors">
                    Global Numerical Weather Prediction Models
                  </h4>
                  <p className="text-[10px] text-slate-400 group-hover:text-slate-300 transition-colors">
                    Atmospheric wind steering, humidity profiles & pressure reanalysis (ECMWF & NOAA GFS)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Smart India Hackathon (SIH) Initiative (Beneath Research Logos) */}
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <Sparkles className="size-4 text-amber-300" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                Smart India Hackathon (SIH) Initiative
              </h3>
            </div>
            
            {/* SIH Banner with Official Provided SIH Logo & Amber Border Glow */}
            <div className="group relative overflow-hidden rounded-2xl border border-amber-400/35 bg-gradient-to-r from-amber-500/[0.08] via-slate-950/80 to-amber-500/[0.04] p-4 shadow-[inset_0_1px_2px_rgba(251,191,36,0.15)] transition-all duration-300 hover:border-amber-400/70 hover:shadow-[0_0_24px_rgba(245,158,11,0.25)]">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                
                {/* Official Provided SIH Logo Element Box */}
                <div className="relative flex shrink-0 items-center justify-center rounded-xl bg-slate-950/90 border border-amber-400/30 p-2.5 shadow-md transition-transform duration-300 group-hover:scale-105">
                  <img
                    src="/sih_logo.png"
                    alt="Smart India Hackathon 2026 Logo"
                    className="h-12 w-auto max-w-[130px] object-contain drop-shadow"
                  />
                </div>

                {/* Text Content */}
                <div className="flex-1 text-center sm:text-left">
                  <p className="text-xs leading-relaxed text-amber-100 font-medium">
                    🏆 <strong className="text-amber-300">Built for Smart India Hackathon (SIH)</strong> — Innovating for Disaster Management, Meteorological Intelligence, and Space Technology for India.
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-300/80">
                    Empowering national disaster response with automated, objective satellite intelligence and real-time intensity tracking.
                  </p>
                </div>

              </div>
            </div>
          </div>

          {/* Section 4: Engineered & Developed By (Placed Directly Beneath SIH Section, Not in Footer) */}
          <div>
            <div className="group relative overflow-hidden rounded-2xl border border-cyan-400/30 bg-gradient-to-r from-cyan-950/50 via-slate-950/80 to-slate-900/60 p-4 shadow-lg transition-all duration-300 hover:border-cyan-400/60 hover:shadow-[0_0_24px_rgba(34,211,238,0.25)]">
              <div className="flex items-center gap-4">
                
                {/* Team Shield Logo with Cyan Glow */}
                <div className="relative group/logo shrink-0">
                  <div className="absolute -inset-1 rounded-2xl bg-cyan-400/40 opacity-70 blur-sm group-hover/logo:opacity-100 transition duration-300" />
                  <img
                    src="/cybernetic_crusaders_logo.jpg"
                    alt="Cybernetic Crusaders Logo"
                    className="relative size-14 rounded-2xl object-cover border-2 border-cyan-400/60 shadow-md transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                {/* Team Typography matching provided image */}
                <div>
                  <p className="text-[10px] font-mono font-bold tracking-widest uppercase text-cyan-400">
                    ENGINEERED & DEVELOPED BY
                  </p>
                  <h4 className="text-lg font-extrabold tracking-wide text-white drop-shadow-[0_0_12px_rgba(34,211,238,0.5)]">
                    Cybernetic Crusaders
                  </h4>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Advanced Deep Learning & Space Telemetry Architecture
                  </p>
                </div>

              </div>
            </div>
          </div>

        </div>

        {/* Clean Modal Footer (Status Bar Only, Team Info Moved Above) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10 px-6 py-3 bg-slate-950/90 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-200">
              Chakravat <span className="text-cyan-300">Manthan</span>
            </span>
            <span className="text-white/20 hidden sm:inline" aria-hidden="true">•</span>
            <span className="text-[10px] font-mono text-slate-400">Operational Meteorological Platform</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-400 rounded-full bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-0.5">
              <ShieldCheck className="size-3 text-emerald-400" />
              Operational AI
            </span>
            <span className="font-mono text-[10px] text-amber-300/90 rounded-full bg-amber-950/40 border border-amber-500/30 px-2.5 py-0.5">
              SIH 2026
            </span>
          </div>
        </div>

      </div>
    </div>
  )
}
