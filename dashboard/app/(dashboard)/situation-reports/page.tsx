"use client";

import * as React from "react";
import Link from "next/link";
import { FileText, MapPin, Plus, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FilterField, LifecycleBadge, ListFeedback, ListHeader, ListPagination, RecordActions, RecordDate, StatusFilters, listSelectClass } from "@/components/outbreaks/list-page";
import { useOutbreakList } from "@/hooks/use-outbreak-list";
import { cn, formatStatus } from "@/lib/utils";
import { situationReportsService, type SituationReportRecord } from "@/services/outbreaks.service";
import { DeleteReportDialog } from "./delete-report-dialog";

const quickFilters = [
  { value: "", label: "All reports" }, { value: "pending_review", label: "Awaiting review" },
  { value: "published", label: "Published" }, { value: "draft", label: "Drafts" },
];

export default function SituationReportsPage() {
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [sort, setSort] = React.useState("updated_at");
  const [page, setPage] = React.useState(1);
  const [deleting, setDeleting] = React.useState<SituationReportRecord | null>(null);
  const { items, total, pages, loading, error, refresh } = useOutbreakList(situationReportsService.list, {
    page, per_page: 20, search: search.trim() || undefined, status: status || undefined,
    sort, order: sort === "title" ? "asc" : "desc",
  });
  const filtered = Boolean(search.trim() || status);
  const clear = () => { setSearch(""); setStatus(""); setPage(1); };
  const change = (setter: (value: string) => void) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { setter(event.target.value); setPage(1); };
  const actions = (item: SituationReportRecord) => <RecordActions href={`/situation-reports/${item.id}`} title={item.title || "Untitled report"} kind="report" onDelete={() => setDeleting(item)} />;

  return <div className="w-full min-w-0 space-y-6 pb-6">
    <ListHeader title="Situation reports" description="Find the latest reports, follow their review progress, and manage supporting documents." icon={FileText} loading={loading} onRefresh={refresh}>
      <Button variant="outline" asChild><Link href="/outbreaks">Browse outbreaks</Link></Button>
      <Button asChild><Link href="/situation-reports/new"><Plus className="mr-2 size-4" aria-hidden="true" />New report</Link></Button>
    </ListHeader>
    <section aria-label="Filter situation reports" className="rounded-xl border bg-card p-4 shadow-xs sm:p-5">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <FilterField id="report-search" label="Search reports"><div className="relative"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" /><Input id="report-search" type="search" className="h-10 rounded-lg pl-9" placeholder="Search title, summary, or area…" value={search} onChange={change(setSearch)} /></div></FilterField>
        <FilterField id="report-status" label="Status"><select id="report-status" className={listSelectClass} value={status} onChange={change(setStatus)}><option value="">All statuses</option>{["draft", "pending_review", "published", "archived", "withdrawn"].map((value) => <option key={value} value={value}>{formatStatus(value)}</option>)}</select></FilterField>
      </div>
      {filtered && <div className="mt-4 flex justify-end border-t pt-3"><Button variant="ghost" size="sm" onClick={clear}><X className="mr-1.5 size-3.5" aria-hidden="true" />Clear filters</Button></div>}
    </section>
    <StatusFilters value={status} onChange={(value) => { setStatus(value); setPage(1); }} options={quickFilters} />
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-base font-semibold">Report library</h2><p role="status" aria-live="polite" className="mt-1 text-sm text-muted-foreground">{loading ? "Loading situation reports…" : error ? "Results unavailable" : `${total} ${total === 1 ? "report" : "reports"}${filtered ? " match your filters" : " in the library"}`}</p></div><div className="flex items-center gap-2"><label htmlFor="report-sort" className="shrink-0 text-xs text-muted-foreground">Sort by</label><select id="report-sort" className={cn(listSelectClass, "h-9 w-auto")} value={sort} onChange={change(setSort)}><option value="updated_at">Recently updated</option><option value="publication_date">Publication date</option><option value="title">Title A–Z</option></select></div></div>
    <ListFeedback loading={loading} error={error} empty={!items.length} filtered={filtered} noun="situation reports" icon={FileText} onRetry={refresh} onClear={clear} createHref="/situation-reports/new" createLabel="New report" />
    {!loading && !error && items.length > 0 && <>
      <div className="hidden overflow-hidden rounded-xl border bg-card lg:block"><Table aria-label="Situation reports"><TableHeader className="bg-muted/40"><TableRow><TableHead className="w-1/3 pl-5">Report</TableHead><TableHead>Status</TableHead><TableHead>Area</TableHead><TableHead>Source</TableHead><TableHead>Publication & verification</TableHead><TableHead className="pr-5 text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
        {items.map((item) => <TableRow key={item.id} className="[&>td]:py-5"><TableCell className="max-w-sm whitespace-normal pl-5"><Link className="font-semibold leading-6 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={`/situation-reports/${item.id}`}>{item.title || "Untitled report"}</Link>{item.supersedes_id && <Badge variant="secondary" className="ml-2">Correction</Badge>}{item.summary && <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-muted-foreground">{item.summary}</p>}</TableCell><TableCell><LifecycleBadge status={item.status} /></TableCell><TableCell className="max-w-36 whitespace-normal text-muted-foreground">{item.geographic_area || "Not specified"}</TableCell><TableCell className="max-w-40 whitespace-normal text-xs leading-5 text-muted-foreground">{item.source_organization || "Not specified"}</TableCell><TableCell><p className="text-xs"><span className="text-muted-foreground">Publication: </span><RecordDate value={item.publication_date} /></p><p className="mt-1.5 text-xs"><span className="text-muted-foreground">Verified: </span><RecordDate value={item.last_verified_at} fallback="Not verified" /></p></TableCell><TableCell className="pr-5">{actions(item)}</TableCell></TableRow>)}
      </TableBody></Table></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:hidden" aria-label="Situation report cards">{items.map((item) => <article key={item.id} className="flex min-w-0 flex-col rounded-xl border bg-card p-5 shadow-xs"><div className="mb-4 flex flex-wrap items-center gap-2"><span className="mr-auto flex size-10 items-center justify-center rounded-xl bg-primary/5 text-primary"><FileText className="size-5" aria-hidden="true" /></span><LifecycleBadge status={item.status} />{item.supersedes_id && <Badge variant="secondary">Correction</Badge>}</div><h3 className="break-words text-base font-semibold leading-6"><Link href={`/situation-reports/${item.id}`} className="hover:underline">{item.title || "Untitled report"}</Link></h3><p className="mt-2 text-xs leading-5 text-muted-foreground">{item.source_organization || "Source not specified"}</p><p className="mt-3 flex items-start gap-1.5 text-sm text-muted-foreground"><MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />{item.geographic_area || "Area not specified"}</p>{item.summary && <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">{item.summary}</p>}<dl className="my-5 grid grid-cols-2 gap-3 border-y py-4 text-xs"><div><dt className="mb-1 text-muted-foreground">Publication date</dt><dd><RecordDate value={item.publication_date} /></dd></div><div><dt className="mb-1 text-muted-foreground">Last verified</dt><dd><RecordDate value={item.last_verified_at} fallback="Not verified" /></dd></div></dl><div className="mt-auto flex flex-wrap items-center justify-between gap-2"><span className="text-xs text-muted-foreground">Updated <RecordDate value={item.updated_at} /></span>{actions(item)}</div></article>)}</div>
    </>}
    {!error && <ListPagination page={page} pages={pages} total={total} count={items.length} loading={loading} onChange={setPage} />}
    <DeleteReportDialog report={deleting} onOpenChange={(open) => { if (!open) setDeleting(null); }} onDeleted={() => { if (items.length === 1 && page > 1) setPage((value) => value - 1); else refresh(); }} />
  </div>;
}
