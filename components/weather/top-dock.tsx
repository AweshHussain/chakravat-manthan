import { Cloud, CloudLightning, Compass, Eye, FlaskConical, Globe, Moon, Radar, Radio, Satellite, ShieldAlert, Sun, Wind } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BasemapMode } from './map-view'

export type Page = 'live' | 'archive'

type Props = {
  page: Page
  onPageChange: (page: Page) => void
  showClouds: boolean
  onToggleClouds: () => void
  enhancedIr: boolean
  onToggleEnhanced: () => void
  showWind: boolean
  onToggleWind: () => void
  systemActive: boolean
  onToggleSystem: () => void
  basemap: BasemapMode
  basemapMode?: 'auto' | 'night' | 'satellite'
  onCycleBasemap: () => void
  showRadar: boolean
  onToggleRadar: () => void
  showDistricts: boolean
  onToggleDistricts: () => void
  onOpenPipeline?: () => void
}

const PAGES: { id: Page; label: string; short: string; icon: typeof Satellite }[] = [
  { id: 'live', label: 'Live Atmospheric & Ocean Satellite', short: 'Live', icon: Satellite },
  { id: 'archive', label: 'Cyclone Archives & AI Research Lab', short: 'Archives', icon: FlaskConical },
]

function ToggleChip({
  active,
  onClick,
  label,
  shortName,
  icon: Icon,
}: {
  active: boolean
  onClick: () => void
  label: string
  shortName: string
  icon: typeof Cloud
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={label}
      className={cn(
        'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70',
        active
          ? 'bg-gradient-to-b from-cyan-400/25 to-cyan-500/10 text-cyan-200 border border-cyan-300/40 shadow-[0_6px_14px_-2px_rgba(6,182,212,0.4),inset_0_1.5px_2px_0_rgba(255,255,255,0.45),inset_0_-2px_4px_0_rgba(0,0,0,0.5)] translate-y-[-1px]'
          : 'text-slate-400 border border-white/[0.06] bg-slate-900/40 shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] hover:bg-white/[0.08] hover:text-slate-100 hover:border-white/15',
      )}
    >
      <Icon className={cn('size-3.5 shrink-0 transition-transform', active && 'scale-110')} aria-hidden="true" />
      <span className="whitespace-nowrap">{shortName}</span>
    </button>
  )
}

export function TopDock(props: Props) {
  const isAuto = !props.basemapMode || props.basemapMode === 'auto'
  const basemapLabel = isAuto
    ? `Basemap: Auto Timeline Sync (${props.basemap === 'satellite' ? 'Daylight Imagery' : 'NASA Night Lights'})`
    : props.basemap === 'night'
      ? 'Basemap: NASA Night Lights (Pinned)'
      : 'Basemap: True-Color Daylight World Imagery (Pinned)'

  const BasemapIcon = isAuto
    ? (props.basemap === 'satellite' ? Sun : Moon)
    : props.basemap === 'satellite'
      ? Sun
      : Moon

  return (
    <header className="pointer-events-none absolute inset-x-0 top-3 z-[1000] flex justify-center px-4">
      <div className="glass pointer-events-auto flex max-w-[98vw] w-fit items-center gap-1.5 rounded-full p-1.5 shadow-2xl overflow-x-auto no-scrollbar">
        {/* Clickable Brand Logo & Title: Refreshes page on click */}
        <button
          type="button"
          onClick={() => {
            window.location.reload()
          }}
          title="Reload Chakravat Manthan"
          className="group flex items-center gap-2.5 pl-2 pr-3 text-left select-none cursor-pointer rounded-full hover:bg-white/[0.08] active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
        >
          <span className="relative flex size-8 shrink-0 items-center justify-center rounded-full overflow-hidden shadow-[0_0_15px_-2px_rgba(34,211,238,0.5)] bg-slate-950/80 border border-cyan-400/30">
            <img
              src="/logo.png"
              alt="Chakravat Manthan Logo"
              className="size-full object-contain animate-[spin_12s_linear_infinite] group-hover:animate-[spin_4s_linear_infinite] transition-all"
            />
          </span>
          <div className="hidden flex-col leading-none md:flex">
            <span className="whitespace-nowrap text-sm font-semibold tracking-wide text-slate-50">
              Chakravat <span className="text-cyan-300">Manthan</span>
            </span>
            <span className="whitespace-nowrap text-[9px] font-medium tracking-wider text-cyan-400/80 uppercase font-mono mt-0.5">
              by Cybernetic Crusaders
            </span>
          </div>
        </button>

        <nav aria-label="Dashboard pages" className="flex shrink-0 items-center gap-1 rounded-full bg-slate-950/70 p-1 border border-white/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]">
          {PAGES.map(({ id, label, short, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => props.onPageChange(id)}
              aria-current={props.page === id ? 'page' : undefined}
              className={cn(
                'flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70',
                props.page === id
                  ? 'bg-gradient-to-b from-slate-100 to-slate-200 text-slate-950 shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1.5px_2px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(148,163,184,0.5)] font-semibold'
                  : 'text-slate-300 hover:bg-white/[0.08] hover:text-white',
              )}
            >
              <Icon className="size-3.5" aria-hidden="true" />
              <span className="hidden lg:inline">{label}</span>
              <span className="lg:hidden">{short}</span>
            </button>
          ))}
        </nav>

        <div className="mx-1 hidden h-6 w-px bg-white/10 sm:block" aria-hidden="true" />

        {/* Basemap Switcher Chip */}
        <button
          type="button"
          onClick={props.onCycleBasemap}
          title={basemapLabel}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-slate-900/60 border border-white/10 px-3 py-1.5 text-[11px] font-medium text-slate-200 transition-all duration-200 shadow-[0_4px_10px_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.15),inset_0_-1px_3px_rgba(0,0,0,0.4)] hover:bg-white/[0.12] hover:border-white/20 active:scale-95"
        >
          <BasemapIcon
            className={cn(
              'size-3.5',
              props.basemap === 'satellite' ? 'text-amber-300' : 'text-cyan-300',
            )}
            aria-hidden="true"
          />
          <span className="capitalize">
            {isAuto ? (props.basemap === 'satellite' ? 'Day (Auto)' : 'Night (Auto)') : props.basemap}
          </span>
        </button>

        <div className="hidden shrink-0 items-center gap-1 sm:flex" role="group" aria-label="Map layers">
          <ToggleChip active={props.showClouds} onClick={props.onToggleClouds} label="Infrared cloud layer (INSAT / Himawari)" shortName="Clouds" icon={Cloud} />
          <ToggleChip active={props.enhancedIr} onClick={props.onToggleEnhanced} label="Enhanced IR color temperature palette" shortName="Enhanced IR" icon={Satellite} />
          <ToggleChip active={props.showRadar} onClick={props.onToggleRadar} label="Live Doppler Radar & Precipitation (RainViewer)" shortName="Doppler Radar" icon={Radar} />
          <ToggleChip active={props.showWind} onClick={props.onToggleWind} label="Real-time wind streamline particle vectors" shortName="Wind Flow" icon={Wind} />
          <ToggleChip active={props.systemActive} onClick={props.onToggleSystem} label="Toggle Cyclone Track & Observation Swath" shortName="Storm Swath" icon={Radio} />
        </div>
      </div>
    </header>
  )
}
