"use client";

import * as React from "react";
import { OutbreakSectionNavigation } from "@/components/outbreaks/outbreak-section-navigation";
import Link from "next/link";
import { Activity, ChevronDown, MapPin, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FilterField, LifecycleBadge, ListFeedback, ListHeader, ListPagination, RecordActions, RecordDate, StatusFilters, listSelectClass } from "@/components/outbreaks/list-page";
import { useOutbreakList } from "@/hooks/use-outbreak-list";
import { cn, formatStatus } from "@/lib/utils";
import { outbreaksService, type OutbreakRecord } from "@/services/outbreaks.service";
import { diseaseService } from "@/services/content-hubs.service";
import { DeleteOutbreakDialog } from "./delete-outbreak-dialog";

const statuses = ["draft", "pending_review", "published", "active", "monitoring", "contained", "closed", "withdrawn"];
const quickFilters = [
  { value: "", label: "All outbreaks" }, { value: "active", label: "Active" },
  { value: "pending_review", label: "Awaiting review" }, { value: "monitoring", label: "Monitoring" },
  { value: "draft", label: "Drafts" },
];

export default function OutbreaksPage() {
  const [diseases, setDiseases] = React.useState<Array<{ id: string; name: string }>>([]);
  const [diseaseError, setDiseaseError] = React.useState(false);
  const [diseaseRevision, setDiseaseRevision] = React.useState(0);
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [disease, setDisease] = React.useState("");
  const [area, setArea] = React.useState("");
  const [tone, setTone] = React.useState("");
  const [effectiveFrom, setEffectiveFrom] = React.useState("");
  const [updatedFrom, setUpdatedFrom] = React.useState("");
  const [sort, setSort] = React.useState("updated_at");
  const [page, setPage] = React.useState(1);
  const [advanced, setAdvanced] = React.useState(false);
  const [deleting, setDeleting] = React.useState<OutbreakRecord | null>(null);
  const { items, total, pages, loading, error, refresh } = useOutbreakList(outbreaksService.list, {
    page, per_page: 20, search: search.trim() || undefined, status: status || undefined,
    disease: disease || undefined, area: area.trim() || undefined, visual_tone: tone || undefined,
    effective_from: effectiveFrom ? new Date(`${effectiveFrom}T00:00:00`).toISOString() : undefined,
    updated_from: updatedFrom ? new Date(`${updatedFrom}T00:00:00`).toISOString() : undefined,
    sort, order: sort === "title" ? "asc" : "desc",
  });

  React.useEffect(() => {
    let cancelled = false;
    void diseaseService.list("", "active").then((result) => {
      if (!cancelled) { setDiseases(result.items || []); setDiseaseError(false); }
    }).catch(() => { if (!cancelled) setDiseaseError(true); });
    return () => { cancelled = true; };
  }, [diseaseRevision]);

  const advancedCount = [area.trim(), tone, effectiveFrom, updatedFrom].filter(Boolean).length;
  const filtered = Boolean(search.trim() || status || disease || advancedCount);
  const clear = () => { setSearch(""); setStatus(""); setDisease(""); setArea(""); setTone(""); setEffectiveFrom(""); setUpdatedFrom(""); setPage(1); };
  const change = (setter: (value: string) => void) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { setter(event.target.value); setPage(1); };
  const actions = (item: OutbreakRecord) => <RecordActions href={`/outbreaks/${item.id}`} title={item.title || "Untitled outbreak"} kind="outbreak" onDelete={() => setDeleting(item)} />;

  return <div className="w-full min-w-0 space-y-6 pb-6">
    <ListHeader title="Outbreaks" description="Follow the response, review updates, and keep verified outbreak information current." icon={Activity} loading={loading} onRefresh={refresh}>
      <Button asChild><Link href="/outbreaks/new"><Plus className="mr-2 size-4" aria-hidden="true" />New outbreak</Link></Button>
    </ListHeader>
    <OutbreakSectionNavigation section="outbreaks" />
    <section aria-label="Filter outbreaks" className="rounded-xl border bg-card p-4 shadow-xs sm:p-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <FilterField id="outbreak-search" label="Search outbreaks" className="md:col-span-2"><div className="relative"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" /><Input id="outbreak-search" type="search" className="h-10 rounded-lg pl-9" value={search} onChange={change(setSearch)} placeholder="Search title, summary, or disease…" /></div></FilterField>
        <FilterField id="outbreak-disease" label="Disease"><select id="outbreak-disease" className={listSelectClass} value={disease} onChange={change(setDisease)}><option value="">All diseases</option>{diseases.map((value) => <option key={value.id} value={value.id}>{value.name}</option>)}</select>{diseaseError && <p className="text-xs text-muted-foreground">Disease list unavailable. <button type="button" className="underline underline-offset-2" onClick={() => setDiseaseRevision((value) => value + 1)}>Retry disease filter</button></p>}</FilterField>
        <FilterField id="outbreak-status" label="Status"><select id="outbreak-status" className={listSelectClass} value={status} onChange={change(setStatus)}><option value="">All statuses</option>{statuses.map((value) => <option key={value} value={value}>{formatStatus(value)}</option>)}</select></FilterField>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-3">
        <Button variant="ghost" size="sm" aria-expanded={advanced} aria-controls="outbreak-more-filters" onClick={() => setAdvanced((value) => !value)}><SlidersHorizontal className="mr-2 size-4" aria-hidden="true" />More filters{advancedCount > 0 && <Badge variant="secondary" className="ml-2">{advancedCount} active</Badge>}<ChevronDown className={cn("ml-2 size-4 transition-transform", advanced && "rotate-180")} aria-hidden="true" /></Button>
        {filtered && <Button variant="ghost" size="sm" onClick={clear}><X className="mr-1.5 size-3.5" aria-hidden="true" />Clear filters</Button>}
      </div>
      <div id="outbreak-more-filters" hidden={!advanced} className="mt-4 grid gap-4 border-t pt-4 sm:grid-cols-2 xl:grid-cols-4">
        <FilterField id="outbreak-area" label="Geographic area"><Input id="outbreak-area" className="h-10 rounded-lg" value={area} onChange={change(setArea)} placeholder="District, region, or area" /></FilterField>
        <FilterField id="outbreak-tone" label="Visual tone"><select id="outbreak-tone" className={listSelectClass} value={tone} onChange={change(setTone)}><option value="">All tones</option>{["neutral", "info", "warning", "critical", "success"].map((value) => <option key={value} value={value}>{formatStatus(value)}</option>)}</select></FilterField>
        <FilterField id="outbreak-effective" label="Effective from"><Input id="outbreak-effective" className="h-10 rounded-lg" type="date" value={effectiveFrom} onChange={change(setEffectiveFrom)} /></FilterField>
        <FilterField id="outbreak-updated" label="Updated from"><Input id="outbreak-updated" className="h-10 rounded-lg" type="date" value={updatedFrom} onChange={change(setUpdatedFrom)} /></FilterField>
      </div>
    </section>
    <StatusFilters value={status} onChange={(value) => { setStatus(value); setPage(1); }} options={quickFilters} />
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-base font-semibold">Response overview</h2><p role="status" aria-live="polite" className="mt-1 text-sm text-muted-foreground">{loading ? "Loading outbreaks…" : error ? "Results unavailable" : `${total} ${total === 1 ? "outbreak" : "outbreaks"}${filtered ? " match your filters" : " in the response library"}`}</p></div>
      <div className="flex items-center gap-2"><label htmlFor="outbreak-sort" className="shrink-0 text-xs text-muted-foreground">Sort by</label><select id="outbreak-sort" className={cn(listSelectClass, "h-9 w-auto")} value={sort} onChange={change(setSort)}><option value="updated_at">Recently updated</option><option value="effective_at">Effective date</option><option value="data_as_of">Data freshness</option><option value="last_verified_at">Last verified</option><option value="title">Title A–Z</option></select></div>
    </div>
    <ListFeedback loading={loading} error={error} empty={!items.length} filtered={filtered} noun="outbreaks" icon={Activity} onRetry={refresh} onClear={clear} createHref="/outbreaks/new" createLabel="New outbreak" />
    {!loading && !error && items.length > 0 && <>
      <div className="hidden overflow-hidden rounded-xl border bg-card lg:block">
        <Table aria-label="Outbreaks"><TableHeader className="bg-muted/40"><TableRow><TableHead className="w-1/3 pl-5">Outbreak</TableHead><TableHead>Status</TableHead><TableHead>Area</TableHead><TableHead>Data & verification</TableHead><TableHead>Updated</TableHead><TableHead className="pr-5 text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
          {items.map((item) => <TableRow key={item.id} className="[&>td]:py-5"><TableCell className="max-w-sm whitespace-normal pl-5"><Link className="font-semibold leading-6 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={`/outbreaks/${item.id}`}>{item.title || "Untitled outbreak"}</Link><div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span>{item.disease_name || "Disease not specified"}</span>{item.supersedes_id && <Badge variant="secondary">Correction</Badge>}{item.visual_tone && <ToneBadge value={item.visual_tone} />}</div></TableCell><TableCell><LifecycleBadge status={item.status} /></TableCell><TableCell className="max-w-40 whitespace-normal text-muted-foreground">{item.geographic_area || "Not specified"}</TableCell><TableCell><p className="text-xs"><span className="text-muted-foreground">Data: </span><RecordDate value={item.data_as_of} /></p><p className="mt-1.5 text-xs"><span className="text-muted-foreground">Verified: </span><RecordDate value={item.last_verified_at} fallback="Not verified" /></p></TableCell><TableCell className="text-xs text-muted-foreground"><RecordDate value={item.updated_at} /></TableCell><TableCell className="pr-5">{actions(item)}</TableCell></TableRow>)}
        </TableBody></Table>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:hidden" aria-label="Outbreak cards">{items.map((item) => <article key={item.id} className="flex min-w-0 flex-col rounded-xl border bg-card p-5 shadow-xs"><div className="mb-4 flex flex-wrap items-center gap-2"><LifecycleBadge status={item.status} />{item.visual_tone && <ToneBadge value={item.visual_tone} />}{item.supersedes_id && <Badge variant="secondary">Correction</Badge>}</div><h3 className="break-words text-base font-semibold leading-6"><Link href={`/outbreaks/${item.id}`} className="hover:underline">{item.title || "Untitled outbreak"}</Link></h3><p className="mt-1 text-xs text-muted-foreground">{item.disease_name || "Disease not specified"}</p><p className="mt-3 flex items-start gap-1.5 text-sm text-muted-foreground"><MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />{item.geographic_area || "Area not specified"}</p>{item.summary && <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">{item.summary}</p>}<dl className="my-5 grid grid-cols-2 gap-3 border-y py-4 text-xs"><div><dt className="mb-1 text-muted-foreground">Data as of</dt><dd><RecordDate value={item.data_as_of} /></dd></div><div><dt className="mb-1 text-muted-foreground">Last verified</dt><dd><RecordDate value={item.last_verified_at} fallback="Not verified" /></dd></div></dl><div className="mt-auto flex flex-wrap items-center justify-between gap-2"><span className="text-xs text-muted-foreground">Updated <RecordDate value={item.updated_at} /></span>{actions(item)}</div></article>)}</div>
    </>}
    {!error && <ListPagination page={page} pages={pages} total={total} count={items.length} loading={loading} onChange={setPage} />}
    <DeleteOutbreakDialog outbreak={deleting} onOpenChange={(open) => { if (!open) setDeleting(null); }} onDeleted={() => { if (items.length === 1 && page > 1) setPage((value) => value - 1); else refresh(); }} />
  </div>;
}

function ToneBadge({ value }: { value: string }) {
  return <Badge variant="outline" className={cn("gap-1 rounded-md text-[11px] font-normal", value === "critical" && "border-rose-200 text-rose-700 dark:border-rose-900 dark:text-rose-300", value === "warning" && "border-amber-200 text-amber-800 dark:border-amber-900 dark:text-amber-300")}><span className="text-muted-foreground">Tone:</span>{formatStatus(value)}</Badge>;
}
