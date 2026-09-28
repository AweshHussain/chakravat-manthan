'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Globe2, LocateFixed, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DAY, istDayStart, istWeekday } from '@/lib/time'

type Props = {
  now: number
  time: number
  onSelectDay: (offset: number) => void
  onLocate: () => void
  locating: boolean
  shifted: boolean
}

export function DaySelector({ now, time, onSelectDay, onLocate, locating, shifted }: Props) {
  // Default to collapsed so the panel is closed until the user explicitly clicks to expand it
  const [collapsed, setCollapsed] = useState(true)
  const today = istDayStart(now)
  const activeOffset = Math.round((istDayStart(time) - today) / DAY)
  const days = Array.from({ length: 5 }, (_, i) => ({
    offset: i,
    label: i === 0 ? 'Today' : istWeekday(today + i * DAY + DAY / 2),
  }))

  const activeDayLabel = days.find((d) => d.offset === activeOffset)?.label ?? 'Today'

  return (
    <aside
      aria-label="Location and forecast panel"
      className={cn(
        'glass absolute top-16 sm:top-20 z-[900] flex flex-col rounded-2xl p-1.5 text-sm transition-all duration-300 ease-out shadow-2xl',
        collapsed ? 'w-auto' : 'w-40',
        shifted ? 'right-2 max-sm:pointer-events-none max-sm:opacity-0 sm:right-[404px]' : 'right-2 sm:right-3',
      )}
    >
      {/* Header with Minimize / Expand Button */}
      <div className="flex items-center justify-between gap-1">
        {collapsed ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onLocate}
              title="Pinpoint current location"
              aria-label="Pinpoint current location"
              className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <LocateFixed className={cn('size-3.5 text-cyan-300', locating && 'animate-spin')} aria-hidden="true" />
              <span>Location</span>
            </button>
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              title="Expand forecast controls"
              aria-label="Expand forecast controls"
              className="flex items-center gap-1 rounded-xl px-2 py-1.5 text-xs font-medium text-cyan-300 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <Calendar className="size-3.5" aria-hidden="true" />
              <ChevronDown className="size-3 text-slate-400" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={onLocate}
              title="Pinpoint current location"
              className="flex flex-1 items-center gap-2 rounded-xl px-2.5 py-1.5 text-left text-xs font-medium text-slate-200 transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
            >
              <LocateFixed className={cn('size-3.5 text-cyan-300', locating && 'animate-spin')} aria-hidden="true" />
              <span>Location</span>
            </button>
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              title="Minimize panel"
              aria-label="Minimize panel"
              className="flex size-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
            >
              <ChevronUp className="size-4" aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      {!collapsed && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-1.5 px-2.5 py-1 font-mono text-[11px] text-slate-400">
            <Globe2 className="size-3 text-cyan-400/80" aria-hidden="true" />
            <span>UTC+5:30 · Observation</span>
          </div>

          <div className="mx-2 my-1 h-px bg-white/10" aria-hidden="true" />

          {/* Current Observation Day */}
          <ul className="flex flex-col gap-0.5">
            <li>
              <button
                type="button"
                onClick={() => onSelectDay(0)}
                aria-pressed={true}
                className="relative w-full rounded-xl bg-slate-100 px-3 py-1.5 text-left text-xs font-semibold text-slate-950 shadow-sm"
              >
                Today (Live Pass)
              </button>
            </li>

            {/* 
              Future forecast days (commented out for now per operational requirement;
              retained below for future multi-day numerical model rollout):
              
              {days.slice(1).map((d) => (
                <li key={d.offset}>
                  <button
                    type="button"
                    onClick={() => onSelectDay(d.offset)}
                    aria-pressed={activeOffset === d.offset}
                    className={cn(
                      'relative w-full rounded-xl px-3 py-1.5 text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70',
                      activeOffset === d.offset
                        ? 'bg-slate-100 font-semibold text-slate-950 shadow-sm'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white',
                    )}
                  >
                    {d.label}
                  </button>
                </li>
              ))}
            */}
          </ul>
        </div>
      )}
    </aside>
  )
}
