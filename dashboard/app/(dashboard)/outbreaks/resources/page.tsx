"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity, ArrowRight, BookOpen, CheckCircle2, ChevronLeft, ChevronRight,
  Clock3, FileText, FolderOpen, Link2, RefreshCw, Search, SearchX, X,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatStatus } from "@/lib/utils";
import type { OutbreakResourceRecord } from "@/services/outbreaks.service";
import { loadResourceGroups, type ResourceGroup } from "./resource-data";

const PAGE_SIZE = 12;
const selectClass = "h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";
const typeLabels: Record<string, string> = {
  guideline: "Guideline", sop: "SOP", ipc_protocol: "IPC protocol",
  situation_report: "Situation report", external_url: "External link",
  internal_route: "App resource", case_definition: "Case definition",
};

function typeKey(resource: OutbreakResourceRecord) {
  return resource.resource_type === "guideline"
    ? resource.document_kind || "guideline"
    : resource.resource_type || "other";
}

function typeLabel(key: string) {
  return typeLabels[key] || formatStatus(key.replace(/-/g, "_")) || "Other";
}

function timestamp(resource: OutbreakResourceRecord) {
  const value = Date.parse(resource.updated_at || resource.created_at || "");
  return Number.isFinite(value) ? value : 0;
}

function paginateGroups(groups: ResourceGroup[], offset: number) {
  const result: Array<ResourceGroup & { total: number }> = [];
  let position = 0;
  for (const group of groups) {
    const resources = group.resources.slice(
      Math.max(0, offset - position), Math.max(0, offset + PAGE_SIZE - position),
    );
    if (resources.length) result.push({ ...group, total: group.resources.length, resources });
    position += group.resources.length;
  }
  return result;
}

function StatusBadge({ status }: { status?: string }) {
  return <Badge variant="outline" className={cn("gap-1.5 rounded-full px-2.5 py-1 font-medium",
    status === "published" && "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
    status === "pending_review" && "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
    status === "approved" && "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300",
    status === "withdrawn" && "border-border bg-muted text-muted-foreground",
  )}><span aria-hidden="true" className="size-1.5 rounded-full bg-current" />{formatStatus(status) || "Unknown status"}</Badge>;
}

export default function OutbreakResourcesPage() {
  const [groups, setGroups] = React.useState<ResourceGroup[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [revision, setRevision] = React.useState(0);
  const [search, setSearch] = React.useState("");
  const [outbreakId, setOutbreakId] = React.useState("");
  const [type, setType] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [sort, setSort] = React.useState("updated");
  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    let cancelled = false;
    void loadResourceGroups().then((result) => {
      if (!cancelled) setGroups(result);
    }).catch((value: unknown) => {
      if (!cancelled) setError(value instanceof Error ? value.message : "Unable to load outbreak resources.");
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [revision]);

  const refresh = () => { setLoading(true); setError(""); setRevision((value) => value + 1); };
  const resetFilters = () => { setSearch(""); setOutbreakId(""); setType(""); setStatus(""); setPage(1); };
  const all = groups.flatMap((group) => group.resources);
  const types = [...new Set(all.map(typeKey))].sort((a, b) => typeLabel(a).localeCompare(typeLabel(b)));
  const statuses = [...new Set(all.map((resource) => resource.status || "unknown"))].sort();
  const query = search.trim().toLocaleLowerCase();
  const filteredGroups = groups.map((group) => ({
    ...group,
    resources: group.resources.filter((resource) =>
      (!outbreakId || group.outbreak.id === outbreakId) &&
      (!type || typeKey(resource) === type) &&
      (!status || (resource.status || "unknown") === status) &&
      (!query || [resource.title, resource.description, resource.issuing_organization,
        group.outbreak.title, group.outbreak.disease_name, typeLabel(typeKey(resource))]
        .filter(Boolean).join(" ").toLocaleLowerCase().includes(query)),
    ).sort((a, b) => sort === "title"
      ? (a.title || "").localeCompare(b.title || "")
      : timestamp(b) - timestamp(a)),
  })).filter((group) => group.resources.length > 0).sort((a, b) => sort === "updated"
    ? Math.max(...b.resources.map(timestamp)) - Math.max(...a.resources.map(timestamp))
    : (a.outbreak.title || "").localeCompare(b.outbreak.title || ""));
  const matches = filteredGroups.reduce((count, group) => count + group.resources.length, 0);
  const totalPages = Math.max(1, Math.ceil(matches / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const offset = (currentPage - 1) * PAGE_SIZE;
  const visibleGroups = paginateGroups(filteredGroups, offset);
  const hasFilters = Boolean(query || outbreakId || type || status);
  const summaries: { label: string; value: string; count: number; icon: LucideIcon; color: string }[] = [
    { label: "All resources", value: "", count: all.length, icon: FolderOpen, color: "text-primary bg-primary/10" },
    { label: "Published", value: "published", count: all.filter((r) => r.status === "published").length, icon: CheckCircle2, color: "text-emerald-700 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300" },
    { label: "Awaiting review", value: "pending_review", count: all.filter((r) => r.status === "pending_review").length, icon: Clock3, color: "text-amber-700 bg-amber-100 dark:bg-amber-950 dark:text-amber-300" },
    { label: "Drafts", value: "draft", count: all.filter((r) => r.status === "draft").length, icon: FileText, color: "text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300" },
  ];

  return <div className="mx-auto w-full max-w-7xl space-y-7 pb-6">
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
      <div className="flex items-start gap-3.5">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/5 text-primary"><FolderOpen className="size-6" aria-hidden="true" /></div>
        <div><p className="mb-1 text-xs font-semibold tracking-widest text-muted-foreground">OUTBREAK RESPONSE</p><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Outbreak resources</h1><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Find response documents, track their review status, and manage resources for each outbreak.</p></div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button variant="outline" size="icon" disabled={loading} onClick={refresh} aria-label="Refresh resources"><RefreshCw aria-hidden="true" className={cn("size-4", loading && "animate-spin motion-reduce:animate-none")} /></Button>
        <Button variant="outline" asChild><Link href="/outbreaks">Browse outbreaks<ArrowRight aria-hidden="true" className="ml-2 size-4" /></Link></Button>
      </div>
    </header>

    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Resource status overview">
      {summaries.map(({ label, value, count, icon: Icon, color }) => <button key={label} type="button" aria-pressed={status === value} disabled={loading || Boolean(error)} onClick={() => { setStatus(value); setPage(1); }} className={cn("flex items-center gap-3 rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default sm:p-5", status === value && "border-primary/40 bg-primary/[0.025]")}>
        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", color)}><Icon aria-hidden="true" className="size-5" /></span>
        <span className="min-w-0"><span className="block text-2xl font-semibold tabular-nums">{loading || error ? "—" : count}</span><span className="block text-xs leading-5 text-muted-foreground sm:text-sm">{label}</span></span>
      </button>)}
    </div>

    <section aria-label="Find resources" className="rounded-xl border bg-card p-4 shadow-xs sm:p-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-2"><label htmlFor="resource-search" className="text-xs font-medium">Search resources</label><div className="relative"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" /><Input id="resource-search" type="search" className="h-10 rounded-lg pl-9" placeholder="Search title, outbreak, or organization…" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></div></div>
        <div className="space-y-2"><label htmlFor="resource-outbreak" className="text-xs font-medium">Outbreak</label><select id="resource-outbreak" className={selectClass} value={outbreakId} onChange={(event) => { setOutbreakId(event.target.value); setPage(1); }}><option value="">All outbreaks</option>{[...groups].sort((a, b) => (a.outbreak.title || "").localeCompare(b.outbreak.title || "")).map(({ outbreak }) => <option key={outbreak.id} value={outbreak.id}>{outbreak.title || "Untitled outbreak"}</option>)}</select></div>
        <div className="space-y-2"><label htmlFor="resource-type" className="text-xs font-medium">Resource type</label><select id="resource-type" className={selectClass} value={type} onChange={(event) => { setType(event.target.value); setPage(1); }}><option value="">All resource types</option>{types.map((key) => <option key={key} value={key}>{typeLabel(key)}</option>)}</select></div>
        <div className="space-y-2"><label htmlFor="resource-status" className="text-xs font-medium">Status</label><select id="resource-status" className={selectClass} value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="">All statuses</option>{[...new Set([...statuses, ...(status ? [status] : [])])].map((key) => <option key={key} value={key}>{formatStatus(key)}</option>)}</select></div>
      </div>
      {hasFilters && <div className="mt-4 flex items-center justify-between gap-3 border-t pt-3"><p className="text-xs text-muted-foreground">Search and filters work together to narrow your results.</p><Button variant="ghost" size="sm" onClick={resetFilters}><X aria-hidden="true" className="mr-1.5 size-3.5" />Clear filters</Button></div>}
    </section>

    {loading ? <section role="status" aria-label="Loading resources" className="space-y-4"><span className="sr-only">Loading outbreak resources…</span><Skeleton className="h-6 w-52" /><div aria-hidden="true" className="grid gap-4 md:grid-cols-2">{Array.from({ length: 4 }, (_, index) => <div key={index} className="space-y-4 rounded-xl border p-5"><Skeleton className="size-10 rounded-xl" /><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-1/2" /></div>)}</div></section>
      : error ? <div role="alert" className="rounded-xl border border-destructive/25 bg-destructive/5 p-6"><h2 className="font-semibold">Resources couldn’t be loaded</h2><p className="mt-2 text-sm text-muted-foreground">{error}</p><Button variant="outline" className="mt-4" onClick={refresh}><RefreshCw aria-hidden="true" className="mr-2 size-4" />Try again</Button></div>
      : all.length === 0 ? <div className="rounded-xl border border-dashed bg-card"><EmptyState icon={FolderOpen} title="Build your outbreak resource library" description="Resources added to an outbreak will appear here. Open an outbreak to add response documents and situation reports." /><div className="-mt-6 flex justify-center pb-8"><Button asChild><Link href="/outbreaks">Choose an outbreak<ArrowRight aria-hidden="true" className="ml-2 size-4" /></Link></Button></div></div>
      : matches === 0 ? <div className="rounded-xl border border-dashed bg-card"><EmptyState icon={SearchX} title="No resources match your filters" description="Try a different title or organization, or clear your filters to see all resources." action={{ label: "Clear filters", onClick: resetFilters }} /></div>
      : <section aria-label="Resource results" className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><p role="status" aria-live="polite" className="text-sm text-muted-foreground"><span className="font-medium text-foreground">{matches} {matches === 1 ? "resource" : "resources"}</span> across {filteredGroups.length} {filteredGroups.length === 1 ? "outbreak" : "outbreaks"}</p><div className="flex items-center gap-2"><label htmlFor="resource-sort" className="shrink-0 text-xs text-muted-foreground">Sort within outbreaks</label><select id="resource-sort" className={cn(selectClass, "h-9 w-auto")} value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }}><option value="updated">Recently updated</option><option value="title">Title A–Z</option></select></div></div>
        {visibleGroups.map(({ outbreak, resources, total }) => <section key={outbreak.id} aria-labelledby={`outbreak-${outbreak.id}`} className="overflow-hidden rounded-xl border bg-muted/20">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/30 px-4 py-4 sm:px-5"><div className="flex min-w-0 items-start gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background text-muted-foreground"><Activity aria-hidden="true" className="size-4" /></span><div className="min-w-0"><h2 id={`outbreak-${outbreak.id}`} className="break-words text-base font-semibold">{outbreak.title || "Untitled outbreak"}</h2><p className="mt-0.5 text-xs leading-5 text-muted-foreground">{[outbreak.disease_name, outbreak.geographic_area].filter(Boolean).join(" · ") || "Outbreak response"}<span className="mx-2" aria-hidden="true">·</span>{total} {total === 1 ? "resource" : "resources"}{resources.length < total ? ` · ${resources.length} on this page` : ""}</p></div></div><Button variant="ghost" size="sm" className="shrink-0" asChild><Link href={`/outbreaks/${outbreak.id}#resources`} aria-label={`Manage resources for ${outbreak.title || "untitled outbreak"}`}>Manage outbreak<ArrowRight aria-hidden="true" className="ml-2 size-4" /></Link></Button></div>
          <div className="grid gap-3 p-3 md:grid-cols-2 sm:gap-4 sm:p-4">{resources.map((resource) => <ResourceCard key={resource.id} resource={resource} outbreakId={outbreak.id} />)}</div>
        </section>)}
        {totalPages > 1 && <nav aria-label="Resource pages" className="flex flex-wrap items-center justify-between gap-3 border-t pt-5"><p className="text-sm text-muted-foreground">Showing {offset + 1}–{Math.min(offset + PAGE_SIZE, matches)} of {matches} resources</p><div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft aria-hidden="true" className="mr-1 size-4" />Previous</Button><span className="px-1 text-xs tabular-nums text-muted-foreground">{currentPage} / {totalPages}</span><Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>Next<ChevronRight aria-hidden="true" className="ml-1 size-4" /></Button></div></nav>}
      </section>}
  </div>;
}

function ResourceCard({ resource, outbreakId }: { resource: OutbreakResourceRecord; outbreakId: string }) {
  const key = typeKey(resource);
  const Icon = resource.resource_type === "external_url" || resource.resource_type === "internal_route"
    ? Link2 : resource.resource_type === "guideline" ? BookOpen : FileText;
  const date = timestamp(resource);
  return <article className="flex min-w-0 flex-col rounded-xl border bg-card p-5 shadow-xs transition-colors hover:border-primary/30">
    <div className="mb-4 flex items-start justify-between gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/5 text-primary"><Icon aria-hidden="true" className="size-5" /></span><StatusBadge status={resource.status} /></div>
    <p className="mb-1.5 text-xs font-medium text-muted-foreground">{typeLabel(key)}</p>
    <h3 className="break-words text-base font-semibold leading-6">{resource.title || "Untitled resource"}</h3>
    <p className="mt-2 line-clamp-2 break-words text-sm leading-6 text-muted-foreground">{resource.description || "No description provided."}</p>
    {resource.issuing_organization && <p className="mt-3 truncate text-xs text-muted-foreground" title={resource.issuing_organization}>{resource.issuing_organization}</p>}
    <div className="mt-auto pt-5"><div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3"><span className="text-xs text-muted-foreground">{date ? <>Updated <time dateTime={new Date(date).toISOString()}>{new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</time></> : "No update date"}</span><Button variant="ghost" size="sm" className="-mr-2" asChild><Link href={`/outbreaks/${outbreakId}#resources`} aria-label={`Manage resource: ${resource.title || "Untitled resource"}`}>Manage resource<ArrowRight aria-hidden="true" className="ml-1.5 size-3.5" /></Link></Button></div></div>
  </article>;
}
