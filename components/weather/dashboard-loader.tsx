'use client'

import dynamic from 'next/dynamic'

const Dashboard = dynamic(() => import('./dashboard'), {
  ssr: false,
  loading: () => (
    <main className="flex h-dvh w-full items-center justify-center bg-slate-950">
      <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-slate-400">
        <span className="size-1.5 animate-pulse rounded-full bg-cyan-300" aria-hidden="true" />
        Chakravat Manthan
      </p>
    </main>
  ),
})

export function DashboardLoader() {
  return <Dashboard />
}
