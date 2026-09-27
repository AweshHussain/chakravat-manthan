'use client'

import { useRef } from 'react'
import { CalendarClock, Moon, Pause, Play, SkipBack, SkipForward, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import { HOUR, formatIST, fromISTInputValue, isDaylight, toISTInputValue } from '@/lib/time'

type Props = {
  time: number
  minTime: number
  maxTime: number
  latestSat: number
  playing: boolean
  onTogglePlay: () => void
  onStep: (dir: 1 | -1) => void
  onChange: (time: number) => void
  panelOpen: boolean
}

function statusFor(time: number, latest: number) {
  const diff = time - latest
  if (Math.abs(diff) < 60_000) return { label: 'LIVE', tone: 'live' as const }
  const mins = Math.round(Math.abs(diff) / 60_000)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  const span = h ? `${h}h${m ? ` ${m}m` : ''}` : `${m}m`
  return diff < 0 ? { label: `−${span}`, tone: 'past' as const } : { label: `+${span} FCST`, tone: 'future' as const }
}

const iconButton =
  'flex size-9 items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70'

export function TimeScrubber(props: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const status = statusFor(props.time, props.latestSat)
  const range = props.maxTime - props.minTime || 1
  const livePct = ((props.latestSat - props.minTime) / range) * 100

  return (
    <div
      className={cn(
        'pointer-events-none absolute bottom-6 z-[1000] flex w-full max-w-[720px] -translate-x-1/2 justify-center px-3 transition-[left] duration-500 ease-out',
        props.panelOpen ? 'left-1/2 sm:left-[calc((100%-392px)/2)]' : 'left-1/2',
      )}
    >
      <div className="glass pointer-events-auto flex w-full items-center gap-1 rounded-full p-1.5">
        <button type="button" className={iconButton} onClick={() => props.onStep(-1)} aria-label="Step backward">
          <SkipBack className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={props.onTogglePlay}
          aria-label={props.playing ? 'Pause animation' : 'Play animation'}
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-950 shadow-[0_0_18px_-4px_rgba(103,232,249,0.8)] transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          {props.playing ? <Pause className="size-4 fill-current" aria-hidden="true" /> : <Play className="ml-0.5 size-4 fill-current" aria-hidden="true" />}
        </button>
        <button type="button" className={iconButton} onClick={() => props.onStep(1)} aria-label="Step forward">
          <SkipForward className="size-4" aria-hidden="true" />
        </button>

        <div className="relative ml-1">
          <button
            type="button"
            onClick={() => inputRef.current?.showPicker?.()}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
            aria-label="Select date and time"
          >
            {isDaylight(props.time) ? (
              <Sun className="size-4 text-amber-300" aria-label="Daytime" />
            ) : (
              <Moon className="size-4 text-cyan-300" aria-label="Nighttime" />
            )}
            <span className="whitespace-nowrap font-mono text-sm tabular-nums text-slate-50">{formatIST(props.time)}</span>
            <span className="hidden whitespace-nowrap font-mono text-[11px] text-slate-400 sm:inline">IST</span>
          </button>
          <input
            ref={inputRef}
            type="datetime-local"
            tabIndex={-1}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-0"
            value={toISTInputValue(props.time)}
            min={toISTInputValue(props.minTime)}
            max={toISTInputValue(props.maxTime)}
            onChange={(e) => {
              if (!e.target.value) return
              const t = fromISTInputValue(e.target.value)
              props.onChange(Math.min(props.maxTime, Math.max(props.minTime, t)))
            }}
          />
        </div>

        <div className="relative mx-2 hidden h-9 flex-1 items-center md:flex">
          <div className="absolute inset-x-0 h-1 rounded-full bg-slate-700/60" aria-hidden="true" />
          <div
            className="absolute left-0 h-1 rounded-full bg-gradient-to-r from-slate-400/60 to-cyan-300/80"
            style={{ width: `${livePct}%` }}
            aria-hidden="true"
          />
          <div className="absolute h-3 w-px bg-cyan-300" style={{ left: `${livePct}%` }} aria-hidden="true" />
          <input
            type="range"
            min={props.minTime}
            max={props.maxTime}
            step={10 * 60 * 1000}
            value={props.time}
            onChange={(e) => {
              const t = Number(e.target.value)
              props.onChange(t > props.latestSat ? Math.round(t / HOUR) * HOUR : t)
            }}
            aria-label="Timeline"
            aria-valuetext={formatIST(props.time)}
            className="cm-range relative w-full"
          />
        </div>

        <span
          className={cn(
            'ml-auto mr-1 flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 font-mono text-[11px] font-medium',
            status.tone === 'live' && 'bg-cyan-400/15 text-cyan-300',
            status.tone === 'past' && 'bg-slate-700/50 text-slate-300',
            status.tone === 'future' && 'bg-amber-400/10 text-amber-200',
          )}
        >
          {status.tone === 'live' && <span className="size-1.5 animate-pulse rounded-full bg-cyan-300" aria-hidden="true" />}
          {status.label}
        </span>
      </div>
    </div>
  )
}
