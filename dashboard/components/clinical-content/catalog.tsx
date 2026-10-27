"use client";

import type { ReactNode } from "react";
import { RefreshCw, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatStatus } from "@/lib/utils";

export function CatalogHeader({ title, description, icon: Icon, loading, onRefresh, children }: {
  title: string; description: string; icon: LucideIcon; loading: boolean; onRefresh: () => void; children?: ReactNode;
}) {
  return <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
    <div className="flex min-w-0 items-start gap-3.5">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/5 text-primary"><Icon className="size-6" aria-hidden="true" /></span>
      <div className="min-w-0"><p className="mb-1 text-xs font-semibold tracking-widest text-muted-foreground">CLINICAL RESOURCES</p><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p></div>
    </div>
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      <Button variant="outline" size="icon" disabled={loading} onClick={onRefresh} aria-label={`Refresh ${title.toLowerCase()}`}><RefreshCw className={cn("size-4", loading && "animate-spin motion-reduce:animate-none")} aria-hidden="true" /></Button>
      {children}
    </div>
  </header>;
}

export function CatalogStatus({ status }: { status: string }) {
  return <Badge variant="outline" className={cn("gap-1.5 rounded-full px-2.5 py-1", status === "active" || status === "published" ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300" : "bg-muted/50 text-muted-foreground")}><span className="size-1.5 rounded-full bg-current" aria-hidden="true" />{formatStatus(status)}</Badge>;
}

export function CatalogLoading({ noun }: { noun: string }) {
  return <div role="status" className="space-y-3 rounded-xl border bg-card p-5"><span className="sr-only">Loading {noun}…</span>{[0, 1, 2].map(index => <div key={index} aria-hidden="true" className="space-y-3 rounded-lg border p-4"><Skeleton className="h-5 w-1/3 motion-reduce:animate-none" /><Skeleton className="h-4 w-2/3 motion-reduce:animate-none" /></div>)}</div>;
}
