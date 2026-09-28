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

export function DaySelector({ onLocate, locating, shifted }: Props) {
  return (
    <aside
      aria-label="Location control"
      className={cn(
        'glass absolute top-16 sm:top-20 z-[900] flex items-center rounded-2xl p-1 text-sm transition-all duration-300 ease-out shadow-2xl',
        shifted ? 'right-2 max-sm:pointer-events-none max-sm:opacity-0 sm:right-[404px]' : 'right-2 sm:right-3',
      )}
    >
      {/* Standalone GPS Pinpoint Button */}
      <button
        type="button"
        onClick={onLocate}
        title="Pinpoint your current location on satellite map"
        aria-label="Pinpoint current location"
        className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-200 transition-all hover:bg-white/10 hover:text-white active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
      >
        <LocateFixed className={cn('size-4 text-cyan-300', locating && 'animate-spin')} aria-hidden="true" />
        <span className="font-semibold tracking-wide">Location</span>
      </button>

      {/*
        Future multi-day forecast dropdown (commented out per operational requirement):
        
        <ul className="flex flex-col gap-0.5">
          {days.map((d) => (
            <li key={d.offset}>
              <button onClick={() => onSelectDay(d.offset)}>{d.label}</button>
            </li>
          ))}
        </ul>
      */}
    </aside>
  )
}
