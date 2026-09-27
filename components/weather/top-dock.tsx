import { Cloud, CloudLightning, Compass, Eye, FlaskConical, Globe, Radar, Radio, Satellite, ShieldAlert, Wind } from 'lucide-react'
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
  icon: Icon,
}: {
  active: boolean
  onClick: () => void
  label: string
  icon: typeof Cloud
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={label}
      className={cn(
        'flex size-9 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70',
        active ? 'bg-cyan-400/15 text-cyan-300 shadow-[0_0_12px_-2px_rgba(34,211,238,0.6)]' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200',
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </button>
  )
}

export function TopDock(props: Props) {
  const basemapLabel =
    props.basemap === 'night'
      ? 'Basemap: NASA Night Lights'
      : props.basemap === 'satellite'
        ? 'Basemap: True-Color Daylight World Imagery'
        : 'Basemap: Carto / Canvas Dark'

  return (
    <header className="pointer-events-none absolute inset-x-0 top-3 z-[1000] flex justify-center px-3">
      <div className="glass pointer-events-auto flex max-w-full items-center gap-1 rounded-full p-1.5 shadow-2xl">
        <div
          onClick={props.onOpenPipeline}
          className="flex items-center gap-2 pl-2 pr-3 text-left select-none cursor-default"
        >
          <span className="relative flex size-7 items-center justify-center rounded-full bg-cyan-400/15 text-cyan-300">
            <CloudLightning className="size-4" aria-hidden="true" />
            <span className="absolute inset-0 animate-ping rounded-full bg-cyan-400/20 [animation-duration:3s]" />
          </span>
          <h1 className="hidden whitespace-nowrap text-sm font-semibold tracking-wide text-slate-50 md:block">
            Chakravat <span className="text-cyan-300">Manthan</span>
          </h1>
        </div>

        <nav aria-label="Dashboard pages" className="flex items-center gap-1 rounded-full bg-slate-900/60 p-1">
          {PAGES.map(({ id, label, short, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => props.onPageChange(id)}
              aria-current={props.page === id ? 'page' : undefined}
              className={cn(
                'flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70',
                props.page === id ? 'bg-slate-100 text-slate-950' : 'text-slate-300 hover:bg-white/5 hover:text-white',
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
          className="flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1.5 text-[11px] font-medium text-slate-200 transition hover:bg-white/[0.12] active:scale-95"
        >
          <Globe className="size-3.5 text-cyan-300" aria-hidden="true" />
          <span className="capitalize">{props.basemap}</span>
        </button>

        <div className="hidden items-center gap-0.5 sm:flex" role="group" aria-label="Map layers">
          <ToggleChip active={props.showClouds} onClick={props.onToggleClouds} label="Infrared cloud layer" icon={Cloud} />
          <ToggleChip active={props.enhancedIr} onClick={props.onToggleEnhanced} label="Enhanced IR colour palette" icon={Satellite} />
          <ToggleChip active={props.showRadar} onClick={props.onToggleRadar} label="Live Doppler Radar & Precipitation" icon={Radar} />
          <ToggleChip active={props.showWind} onClick={props.onToggleWind} label="Wind streamlines" icon={Wind} />
          <ToggleChip active={props.showDistricts} onClick={props.onToggleDistricts} label="Coastal District Alert Boundaries" icon={ShieldAlert} />
          <ToggleChip active={props.systemActive} onClick={props.onToggleSystem} label="Toggle Cyclone Track & Swath" icon={Radio} />
        </div>
      </div>
    </header>
  )
}
