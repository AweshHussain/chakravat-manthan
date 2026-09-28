'use client'

import { Pause, Play, RotateCcw, X, FastForward } from 'lucide-react'
import { cn } from '@/lib/utils'
import { categoryFor, type ArchiveCyclone } from '@/lib/cyclones'

type Props = {
  cyclone: ArchiveCyclone
  progress: number
  playing: boolean
  speed: number
  currentWindKt: number
  currentPressureHpa: number
  elapsedHours: number
  phaseName: string
  panelOpen: boolean
  onTogglePlay: () => void
  onChangeProgress: (p: number) => void
  onCycleSpeed: () => void
  onReset: () => void
  onExit: () => void
}

export function SimulationScrubber(props: Props) {
  const cat = categoryFor(props.currentWindKt)
  const totalH = props.cyclone.durationHours || 96

  return (
    <div
      className={cn(
        'pointer-events-none absolute bottom-6 z-[1000] flex w-full max-w-[800px] -translate-x-1/2 justify-center px-3 transition-[left] duration-500 ease-out',
        props.panelOpen ? 'left-1/2 sm:left-[calc((100%-392px)/2)]' : 'left-1/2',
      )}
    >
      <div className="glass pointer-events-auto flex w-full flex-col gap-2 rounded-3xl p-3 shadow-2xl border border-cyan-400/25">
        {/* Top Info Bar */}
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <span
              className="flex h-6 px-2 shrink-0 items-center justify-center rounded-lg font-mono text-[10px] font-bold text-slate-950"
              style={{ background: cat.color }}
            >
              {cat.code}
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
                <span>{props.cyclone.name} ({props.cyclone.year}) Simulation</span>
                <span className="text-[10px] font-normal text-cyan-300">· {props.phaseName}</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {props.cyclone.startDate} · {props.cyclone.basin}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="rounded-md bg-white/5 px-2 py-0.5 text-cyan-300 font-bold">
                {props.currentWindKt} kt
              </span>
              <span className="rounded-md bg-white/5 px-2 py-0.5 text-slate-300">
                {props.currentPressureHpa} hPa
              </span>
            </div>

            <button
              type="button"
              onClick={props.onExit}
              className="flex items-center gap-1 rounded-xl bg-white/5 px-2.5 py-1 text-xs text-slate-300 hover:bg-rose-500/20 hover:text-rose-200 transition-colors"
              title="Exit simulation and return to live view"
            >
              <X className="size-3.5" />
              <span>Exit</span>
            </button>
          </div>
        </div>

        {/* Playback Controls & Slider */}
        <div className="flex items-center gap-2.5 pt-0.5">
          <button
            type="button"
            onClick={props.onReset}
            className="flex size-8 items-center justify-center rounded-full text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            title="Restart simulation from genesis"
          >
            <RotateCcw className="size-3.5" />
          </button>

          <button
            type="button"
            onClick={props.onTogglePlay}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-cyan-400 text-slate-950 shadow-[0_0_16px_rgba(34,211,238,0.6)] hover:scale-105 transition-all"
            title={props.playing ? 'Pause' : 'Play'}
          >
            {props.playing ? <Pause className="size-4 fill-current" /> : <Play className="ml-0.5 size-4 fill-current" />}
          </button>

          <button
            type="button"
            onClick={props.onCycleSpeed}
            className="flex h-7 items-center gap-1 rounded-lg bg-white/5 px-2 text-[11px] font-mono text-slate-300 hover:bg-white/10 transition-colors"
            title="Playback speed"
          >
            <FastForward className="size-3 text-cyan-300" />
            <span>{props.speed}x</span>
          </button>

          {/* Timeline Range Slider */}
          <div className="relative mx-2 flex-1 flex items-center">
            <input
              type="range"
              min={0}
              max={1}
              step={0.005}
              value={props.progress}
              onChange={(e) => props.onChangeProgress(parseFloat(e.target.value))}
              className="cm-range relative w-full cursor-pointer"
            />
          </div>

          {/* Elapsed Time Counter */}
          <div className="flex items-center shrink-0 font-mono text-[11px] text-slate-300 bg-white/5 px-2.5 py-1 rounded-xl">
            <span className="text-cyan-300 font-semibold">{props.elapsedHours}h</span>
            <span className="text-slate-500 mx-1">/</span>
            <span>{totalH}h</span>
          </div>
        </div>
      </div>
    </div>
  )
}
