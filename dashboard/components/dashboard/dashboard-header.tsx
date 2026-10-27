"use client"

import { LayoutDashboard, RefreshCw, type LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"

export function DashboardHeader({ title, description, icon: Icon = LayoutDashboard, loading, onRefresh, children }: {
  title: string; description: string; icon?: LucideIcon; loading: boolean; onRefresh: () => void; children?: ReactNode
}) {
  return <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div className="flex min-w-0 items-start gap-3.5">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/5 text-primary"><Icon className="size-6" aria-hidden="true" /></span>
      <div className="min-w-0 space-y-1"><p className="text-xs font-semibold tracking-widest text-muted-foreground">WORKSPACE INSIGHTS</p><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1><p className="text-sm leading-6 text-muted-foreground">{description}</p></div>
    </div>
    <div className="flex shrink-0 flex-wrap items-center gap-2">{children}<Button variant="outline" disabled={loading} onClick={onRefresh}><RefreshCw className={loading ? "size-4 animate-spin" : "size-4"} aria-hidden="true" />{loading ? "Refreshing…" : "Refresh"}</Button></div>
  </header>
}

export function DashboardLoading() {
  return <div role="status" className="space-y-5"><span className="sr-only">Loading dashboard data…</span><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <div key={i} className="h-36 animate-pulse rounded-xl border bg-muted/40" />)}</div><div className="grid gap-4 xl:grid-cols-2"><div className="h-80 animate-pulse rounded-xl border bg-muted/40" /><div className="h-80 animate-pulse rounded-xl border bg-muted/40" /></div></div>
}
