'use client'

import dynamic from 'next/dynamic'

const Dashboard = dynamic(() => import('./dashboard'), {
  ssr: false,
  loading: () => (
    <main className="flex h-dvh w-full flex-col items-center justify-center gap-3 bg-slate-950">
      <div className="relative size-12 overflow-hidden rounded-full border border-cyan-400/40 p-1 shadow-[0_0_20px_-3px_rgba(34,211,238,0.6)]">
        <img src="/logo.png" alt="Chakravat Manthan" className="size-full object-contain animate-[spin_8s_linear_infinite]" />
      </div>
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-slate-200">
          <span className="size-1.5 animate-pulse rounded-full bg-cyan-300" aria-hidden="true" />
          Chakravat Manthan
        </p>
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-400/80">
          Built by Cybernetic Crusaders
        </span>
      </div>
    </main>
  ),
})

export function DashboardLoader() {
  return <Dashboard />
}
