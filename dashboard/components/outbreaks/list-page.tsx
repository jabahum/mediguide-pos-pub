"use client";

import * as React from "react";
import { DashboardLink as Link } from "@/components/dialogs/create-dialog-context";
import { ArrowRight, ChevronLeft, ChevronRight, MoreHorizontal, RefreshCw, SearchX, Trash2, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn, formatStatus } from "@/lib/utils";

export const listSelectClass = "h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

export function ListHeader({ title, description, icon: Icon, loading, onRefresh, children }: {
  title: string; description: string; icon: LucideIcon; loading: boolean; onRefresh: () => void; children: React.ReactNode;
}) {
  return <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
    <div className="flex items-start gap-3.5">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/5 text-primary"><Icon className="size-6" aria-hidden="true" /></span>
      <div><p className="mb-1 text-xs font-semibold tracking-widest text-muted-foreground">OUTBREAK RESPONSE</p><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p></div>
    </div>
    <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
      <Button variant="outline" size="icon" disabled={loading} onClick={onRefresh} aria-label={`Refresh ${title.toLowerCase()}`}><RefreshCw className={cn("size-4", loading && "animate-spin motion-reduce:animate-none")} aria-hidden="true" /></Button>
      {children}
    </div>
  </header>;
}

export function FilterField({ id, label, children, className }: { id: string; label: string; children: React.ReactNode; className?: string }) {
  return <div className={cn("space-y-2", className)}><label htmlFor={id} className="text-xs font-medium">{label}</label>{children}</div>;
}

export function StatusFilters({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return <div role="group" aria-label="Quick status filters" className="flex flex-wrap gap-1 rounded-lg bg-muted/50 p-1">
    {options.map((option) => <button key={option.value} type="button" aria-pressed={value === option.value} onClick={() => onChange(option.value)} className={cn("rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", value === option.value ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:bg-background/60 hover:text-foreground")}>{option.label}</button>)}
  </div>;
}

export function LifecycleBadge({ status }: { status?: string }) {
  const color = status === "active" ? "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300"
    : status === "published" || status === "closed" ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300"
    : status === "pending_review" || status === "monitoring" ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300"
    : status === "approved" || status === "contained" ? "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300"
    : "border-border bg-muted/50 text-muted-foreground";
  return <Badge variant="outline" className={cn("gap-1.5 rounded-full px-2.5 py-1 font-medium", color)}><span aria-hidden="true" className="size-1.5 rounded-full bg-current" />{formatStatus(status) || "Unknown status"}</Badge>;
}

export function RecordDate({ value, fallback = "Not recorded" }: { value?: string; fallback?: string }) {
  const date = new Date(value || "");
  if (!Number.isFinite(date.getTime())) return <span className="text-muted-foreground">{fallback}</span>;
  return <time dateTime={date.toISOString()} title={date.toLocaleString("en-GB")}>{date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</time>;
}

export function RecordActions({ href, title, kind, onDelete }: { href: string; title: string; kind: "outbreak" | "report"; onDelete: () => void }) {
  return <div className="flex shrink-0 items-center gap-1">
    <Button variant="outline" size="sm" asChild><Link href={href} aria-label={`Open ${kind}: ${title}`}>Open<ArrowRight className="ml-1 size-3.5" aria-hidden="true" /></Link></Button>
    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`More actions for ${title}`}><MoreHorizontal className="size-4" aria-hidden="true" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={onDelete}><Trash2 className="mr-2 size-4" aria-hidden="true" />Delete {kind}</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
  </div>;
}

export function ListFeedback({ loading, error, empty, filtered, noun, icon: Icon, onRetry, onClear, createHref, createLabel }: {
  loading: boolean; error: string; empty: boolean; filtered: boolean; noun: string; icon: LucideIcon;
  onRetry: () => void; onClear: () => void; createHref: string; createLabel: string;
}) {
  if (loading) return <div role="status" className="space-y-3 rounded-xl border bg-card p-5"><span className="sr-only">Loading {noun}…</span>{[0, 1, 2].map((index) => <div aria-hidden="true" key={index} className="flex gap-4 rounded-lg border p-4"><Skeleton className="size-10 shrink-0 motion-reduce:animate-none" /><div className="w-full space-y-3"><Skeleton className="h-4 w-2/3 motion-reduce:animate-none" /><Skeleton className="h-3 w-1/3 motion-reduce:animate-none" /></div></div>)}</div>;
  if (error) return <div role="alert" className="rounded-xl border border-destructive/25 bg-destructive/5 p-6"><h2 className="font-semibold">Unable to load {noun}</h2><p className="mt-2 text-sm text-muted-foreground">{error}</p><Button variant="outline" className="mt-4" onClick={onRetry}><RefreshCw className="mr-2 size-4" aria-hidden="true" />Try again</Button></div>;
  if (!empty) return null;
  return <div className="rounded-xl border border-dashed bg-card"><EmptyState icon={filtered ? SearchX : Icon} title={filtered ? `No ${noun} match your filters` : `No ${noun} yet`} description={filtered ? "Try a different search or clear your filters to see all records." : `Create your first record to start organizing ${noun} and their review workflow.`} action={filtered ? { label: "Clear filters", onClick: onClear } : undefined} />{!filtered && <div className="-mt-6 flex justify-center pb-8"><Button asChild><Link href={createHref}>{createLabel}</Link></Button></div>}</div>;
}

export function ListPagination({ page, pages, total, count, loading, onChange }: { page: number; pages: number; total: number; count: number; loading: boolean; onChange: (page: number) => void }) {
  if (loading || total === 0) return null;
  return <nav aria-label="Results pages" className="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
    <p className="text-sm text-muted-foreground">Showing {(page - 1) * 20 + 1}–{(page - 1) * 20 + count} of {total}</p>
    {pages > 1 && <div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}><ChevronLeft className="mr-1 size-4" aria-hidden="true" />Previous</Button><span className="px-1 text-xs tabular-nums text-muted-foreground">Page {page} of {pages}</span><Button variant="outline" size="sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>Next<ChevronRight className="ml-1 size-4" aria-hidden="true" /></Button></div>}
  </nav>;
}
