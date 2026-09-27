'use client'

import { Globe2, LocateFixed } from 'lucide-react'
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
  const today = istDayStart(now)
  const activeOffset = Math.round((istDayStart(time) - today) / DAY)
  const days = Array.from({ length: 5 }, (_, i) => ({ offset: i, label: i === 0 ? 'Today' : istWeekday(today + i * DAY + DAY / 2) }))

  return (
    <aside
      aria-label="Forecast day selector"
      className={cn(
        'glass absolute top-20 z-[900] flex w-36 flex-col gap-0.5 rounded-2xl p-1.5 text-sm transition-all duration-500 ease-out',
        shifted ? 'right-3 max-sm:pointer-events-none max-sm:opacity-0 sm:right-[404px]' : 'right-3',
      )}
    >
      <button
        type="button"
        onClick={onLocate}
        className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-slate-200 transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
      >
        <LocateFixed className={cn('size-4 text-cyan-300', locating && 'animate-spin')} aria-hidden="true" />
        Your Location
      </button>
      <div className="flex items-center gap-2 px-3 py-2 font-mono text-xs text-slate-400">
        <Globe2 className="size-4" aria-hidden="true" />
        UTC+5:30
      </div>
      <div className="mx-2 my-1 h-px bg-white/10" aria-hidden="true" />
      <ul className="flex flex-col gap-0.5">
        {days.map((d) => (
          <li key={d.offset}>
            <button
              type="button"
              onClick={() => onSelectDay(d.offset)}
              aria-pressed={activeOffset === d.offset}
              className={cn(
                'relative w-full rounded-xl px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70',
                activeOffset === d.offset ? 'bg-slate-100 font-medium text-slate-950' : 'text-slate-300 hover:bg-white/5 hover:text-white',
              )}
            >
              {d.label}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  )
}
