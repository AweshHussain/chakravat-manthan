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
  Users,
  Wind,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  open: boolean
  onClose: () => void
}

const TEAM_MEMBERS = [
  { name: 'Awesh Hussain', role: 'AI Architecture & Deep Learning (CNN-GRU)' },
  { name: 'Adeeb Razi', role: 'Geospatial Engineering & Satellite Ingestion' },
  { name: 'Samia Sayeed', role: 'Meteorological Data Analysis & IMD Verification' },
  { name: 'Sania Khan', role: 'Full-Stack Integration & Cloud Pipelines' },
  { name: 'Syed Mohammad Sohaib Hussain', role: 'Pipeline Optimization & Real-Time Sync' },
  { name: 'Syed Mohammad Zaid Iqbal', role: 'UI/UX Design Systems & Visual Telemetry' },
]

const SYSTEM_PILLARS = [
  {
    icon: Satellite,
    title: 'ISRO MOSDAC Satellite Ingestion',
    color: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    description:
      'Direct payload ingestion from INSAT-3D/3DR TIR-1 (10.8 µm) thermal infrared imagery over the North Indian Ocean basin, Arabian Sea, and Bay of Bengal.',
  },
  {
    icon: Database,
    title: 'Decoupled Two-Database Architecture',
    color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    description:
      'Private Ingestion Buffer (DB 1) guarantees zero-drop payload persistence, while Public Telemetry (DB 2) feeds the real-time Vercel Edge frontend via WebSockets.',
  },
  {
    icon: BrainCircuit,
    title: 'PyTorch 4-Stage CNN + 2-Layer GRU',
    color: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    description:
      'Custom multi-task spatio-temporal deep neural network classifying 8 IMD cyclone stages (TD → SuCS) with simultaneous regression of sustained wind (kt) and central pressure (hPa).',
  },
  {
    icon: Wind,
    title: 'Rankine & Holland Vortex Physics',
    color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
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
              <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full overflow-hidden shadow-[0_0_20px_-2px_rgba(34,211,238,0.5)] bg-slate-950 border border-cyan-400/40">
                <img
                  src="/logo.png"
                  alt="Chakravat Manthan Logo"
                  className="size-full object-contain animate-[spin_12s_linear_infinite]"
                />
              </span>
              <div>
                <h2 id="about-title" className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                  Chakravat <span className="text-cyan-300">Manthan</span>
                </h2>
                <p className="text-[11px] font-mono tracking-wider uppercase text-cyan-400/90 font-medium">
                  by Cybernetic Crusaders
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

        {/* Scrollable Content Body */}
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5 no-scrollbar">
          
          {/* Section: Project Mission & Overview */}
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <Sparkles className="size-4 text-cyan-300" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                Project Overview & Core Mission
              </h3>
            </div>
            <p className="text-xs leading-relaxed text-slate-300/90">
              Developed by <strong className="text-white">Cybernetic Crusaders</strong>, <strong className="text-cyan-300">Chakravat Manthan</strong> bridges raw space-borne geostationary earth observation with autonomous artificial intelligence. The system automates the multi-hour manual subjective Dvorak analysis pipeline into an instantaneous, objective, probabilistic inference workflow—ensuring zero data drops and automated disaster warning dissemination.
            </p>
          </div>

          {/* Section: Technical Architecture & Working */}
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
                  <div key={pillar.title} className="clay-card p-3.5 border border-white/10">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={cn('flex size-6 items-center justify-center rounded-lg border', pillar.color)}>
                        <Icon className="size-3.5" />
                      </span>
                      <h4 className="text-xs font-semibold text-slate-100">{pillar.title}</h4>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-400">
                      {pillar.description}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Section: Team Members */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="size-4 text-cyan-300" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                Team Members — Cybernetic Crusaders
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {TEAM_MEMBERS.map((member, idx) => (
                <div
                  key={member.name}
                  className="flex items-center gap-3 rounded-2xl bg-slate-900/50 border border-white/10 p-3 shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-cyan-400/15 border border-cyan-400/30 font-mono text-xs font-bold text-cyan-300">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-semibold text-slate-100 truncate">{member.name}</h4>
                    <p className="text-[10px] text-slate-400 truncate">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-white/10 px-6 py-3 bg-slate-950/80 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5 font-mono">
            <ShieldCheck className="size-3.5 text-emerald-400" />
            Operational AI · India Meteorological Domain
          </span>
          <button
            type="button"
            onClick={onClose}
            className="clay-btn rounded-xl px-4 py-1.5 text-xs font-semibold text-white"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  )
}
