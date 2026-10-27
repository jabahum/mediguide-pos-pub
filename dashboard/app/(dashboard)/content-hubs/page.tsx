"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Layers, Search, SearchX, ArrowRight, Stethoscope, Activity, Users } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CatalogHeader, CatalogLoading, CatalogStatus } from "@/components/clinical-content/catalog";
import { FilterField, ListPagination, RecordDate, StatusFilters } from "@/components/outbreaks/list-page";
import { hasBackendPermission } from "@/lib/backend-client";
import { showToast } from "@/lib/toast";
import { formatStatus } from "@/lib/utils";
import { ContentHub, contentHubService } from "@/services/content-hubs.service";

export default function ContentHubsPage() {
  const router = useRouter();
  const canManage = hasBackendPermission("content_hub.manage");
  const [rows, setRows] = React.useState<ContentHub[]>([]);
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [pages, setPages] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [revision, setRevision] = React.useState(0);
  const filtered = Boolean(search.trim() || status);
  const refresh = () => { setLoading(true); setRevision(value => value + 1); };
  const clear = () => { setLoading(true); setSearch(""); setStatus(""); setPage(1); };
  React.useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      setError("");
      void contentHubService
        .list({ search, status, page, per_page: 20 })
        .then(value => {
          if (cancelled) return;
          if (page > Math.max(1, value.total_pages)) { setPage(Math.max(1, value.total_pages)); return; }
          setRows(value.items || []);
          setTotal(value.total_items);
          setPages(value.total_pages);
        })
        .catch(error => {
          if (cancelled) return;
          setError(error instanceof Error ? error.message : "Unable to load hubs.");
          showToast.error("Hubs unavailable", error instanceof Error ? error.message : "Try again.");
        })
        .finally(() => { if (!cancelled) setLoading(false); });
    }, 200);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [search, status, page, revision]);
  return (
    <div className="w-full min-w-0 space-y-6">
      <CatalogHeader title="Content hubs" description="Bring related clinical resources together, organize their pillars, and manage publication for web and mobile." icon={Layers} loading={loading} onRefresh={refresh}>
        {canManage && <Button asChild><Link href="/content-hubs/new"><Plus className="mr-2 size-4" aria-hidden="true" />New hub</Link></Button>}
      </CatalogHeader>
      <div className="rounded-xl border bg-card p-4 shadow-xs sm:p-5">
        <FilterField id="hub-search" label="Search content hubs"><div className="relative"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" /><Input id="hub-search" className="pl-9" value={search} onChange={event => { setLoading(true); setSearch(event.target.value); setPage(1); }} placeholder="Search hub name or description…" /></div></FilterField>
      </div>
      <StatusFilters value={status} onChange={value => { if (value === status) return; setLoading(true); setStatus(value); setPage(1); }} options={[{ value: "", label: "All hubs" }, { value: "draft", label: "Drafts" }, { value: "published", label: "Published" }, { value: "archived", label: "Archived" }]} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="font-semibold">Hub library</h2><p className="mt-1 text-sm text-muted-foreground" aria-live="polite">{loading ? "Loading hubs…" : error ? "Library unavailable" : `${total} ${total === 1 ? "hub" : "hubs"}${filtered ? " matching your filters" : " in the library"}`}</p></div>
        {filtered && <Button variant="ghost" size="sm" onClick={clear}>Clear filters</Button>}
      </div>
      {loading ? <CatalogLoading noun="content hubs" /> : error ? <div role="alert" className="rounded-xl border border-destructive/25 bg-destructive/5 p-6"><h2 className="font-semibold">Unable to load content hubs</h2><p className="mt-2 text-sm text-muted-foreground">{error}</p><Button className="mt-4" variant="outline" onClick={refresh}>Try again</Button></div> : rows.length === 0 ? <EmptyState
        className="rounded-xl border border-dashed"
        icon={filtered ? SearchX : Layers}
        title={filtered ? "No matching content hubs" : "No content hubs yet"}
        description={filtered ? "Try another name or clear your filters." : "Create a hub to organize approved disease and outbreak resources."}
        action={filtered ? { label: "Clear filters", onClick: clear } : canManage ? { label: "New hub", onClick: () => router.push("/content-hubs/new") } : { label: "Refresh", onClick: refresh }}
      /> : <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {rows.map(row => <Card key={row.id} className="flex min-w-0 flex-col gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md">
          <CardHeader className="gap-3 border-b bg-muted/20 p-5">
            <div className="flex items-center justify-between gap-3"><span className="flex size-10 items-center justify-center rounded-xl border bg-background"><Layers className="size-5 text-primary" aria-hidden="true" /></span><CatalogStatus status={row.status} /></div>
            <CardTitle className="break-words text-lg leading-7"><Link className="rounded-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={`/content-hubs/${row.id}`}>{row.name}</Link></CardTitle>
            <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{row.description || "No description provided."}</p>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4 p-5">
            <div className="space-y-2"><p className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><Stethoscope className="size-3.5" aria-hidden="true" />Diseases & conditions</p><div className="flex flex-wrap gap-1.5">{row.diseases?.length ? row.diseases.map(value => <Badge variant="secondary" className="max-w-full whitespace-normal break-words" key={value.id}>{value.name}</Badge>) : <p className="text-sm text-muted-foreground">No conditions linked</p>}</div></div>
            <div className="space-y-2"><p className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><Activity className="size-3.5" aria-hidden="true" />Outbreaks</p><p className="line-clamp-2 text-sm">{row.outbreaks?.map(value => value.title).join(", ") || "No outbreaks linked"}</p></div>
            <p className="flex items-center gap-2 text-xs text-muted-foreground"><Users className="size-3.5" aria-hidden="true" />Audience: {formatStatus(row.audience || "all")}</p>
            <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t pt-4"><p className="text-xs text-muted-foreground">{row.status === "published" ? <>Published <RecordDate value={row.published_at} /></> : row.status === "archived" ? "Archived from publication" : "Draft · not published"}</p><Button variant="outline" size="sm" asChild><Link href={`/content-hubs/${row.id}`} aria-label={`${canManage ? "Manage" : "View"} hub: ${row.name}`}>{canManage ? "Manage hub" : "View hub"}<ArrowRight className="ml-1 size-3.5" aria-hidden="true" /></Link></Button></div>
          </CardContent>
        </Card>)}
      </div>}
      {!error && <ListPagination page={page} pages={pages} total={total} count={rows.length} loading={loading} onChange={value => { setLoading(true); setPage(value); }} />}
    </div>
  );
}
