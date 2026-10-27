"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, RefreshCw, Search, ShieldCheck } from "lucide-react"
import { ToolSectionHeader, ToolStatusBadge } from "@/components/clinical-tools/tool-section"
import { TablePagination } from "@/components/ui/table-pagination"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Input } from "@/components/ui/input"
import { clinicalToolService, type ClinicalToolReviewQueue } from "@/services/clinical-tool.service"
import { RiskLevelBadge } from "@/components/clinical-tools/risk-level"
import { formatStatus } from "@/lib/utils"

export default function ClinicalToolReviewQueuePage() {
  const [query, setQuery] = React.useState("")
  const [status, setStatus] = React.useState("pending_review")
  const [type, setType] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(20)
  const [data, setData] = React.useState<ClinicalToolReviewQueue>()
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")
  const request = React.useRef(0)

  const load = React.useCallback(async () => {
    const current = ++request.current
    setLoading(true)
    setError("")
    try {
      const result = await clinicalToolService.reviewQueue({ page, per_page: pageSize, search: query, status, type, sort: "created_at", order: "desc" })
      if (current === request.current) setData(result)
    } catch (cause) {
      if (current === request.current) setError(cause instanceof Error ? cause.message : "Unable to load the clinical review queue")
    } finally {
      if (current === request.current) setLoading(false)
    }
  }, [page, pageSize, query, status, type])
  React.useEffect(() => { void load(); return () => { request.current += 1 } }, [load])

  function resetFilters() {
    setQuery("")
    setStatus("pending_review")
    setType("")
    setPage(1)
  }

  return <div className="w-full min-w-0 space-y-6">
    <ToolSectionHeader section="review" icon={ShieldCheck} title="Clinical tool review" description="Find a version, check its validation and test evidence, and open the protected review workspace."
      actions={[{ label: "Refresh", variant: "outline", icon: <RefreshCw className={loading ? "size-4 animate-spin" : "size-4"} aria-hidden="true" />, disabled: loading, onClick: () => void load() }]} />
    <Card className="rounded-xl shadow-xs"><CardContent className="grid gap-4 pt-6 md:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
      <label className="space-y-2 text-sm font-medium md:col-span-2 xl:col-span-1"><span>Search review queue</span><div className="relative"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" /><Input className="pl-9" value={query} onChange={event => { setQuery(event.target.value); setPage(1) }} placeholder="Search tool or version…" /></div></label>
      <label className="space-y-2 text-sm font-medium"><span>Version status</span><select className="h-10 w-full rounded-lg border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={status} onChange={event => { setStatus(event.target.value); setPage(1) }}><option value="pending_review">Pending review</option><option value="draft,pending_review,approved,published">All review states</option><option value="draft">Draft</option><option value="approved">Approved</option><option value="published">Published</option></select></label>
      <label className="space-y-2 text-sm font-medium"><span>Tool type</span><select className="h-10 w-full rounded-lg border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={type} onChange={event => { setType(event.target.value); setPage(1) }}><option value="">All tool types</option><option value="calculator">Calculator</option><option value="decision_tool">Decision tool</option><option value="checklist">Checklist</option></select></label>
    </CardContent></Card>
    <section className="space-y-4" aria-labelledby="queue-heading">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 id="queue-heading" className="text-base font-semibold">Version review queue</h2><p className="mt-1 text-sm text-muted-foreground">{loading ? "Loading matching versions…" : error ? "The queue could not be loaded." : `${(data?.total_items ?? 0).toLocaleString()} versions match your filters`}</p></div><Button variant="ghost" size="sm" onClick={resetFilters}>Reset filters</Button></div>
      {loading ? <div role="status" className="grid gap-4 xl:grid-cols-2"><span className="sr-only">Loading review queue…</span>{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-52 animate-pulse rounded-xl border bg-muted/40" />)}</div>
        : error ? <Card className="border-destructive"><CardContent className="space-y-3 pt-6"><p role="alert">{error}</p><Button onClick={() => void load()}>Try again</Button></CardContent></Card>
        : !data?.items.length ? <Card className="rounded-xl"><CardContent className="py-10"><EmptyState icon={ShieldCheck} title="No versions match these filters" description="Try another search, version status, or tool type." /></CardContent></Card>
        : <div className="grid gap-4 xl:grid-cols-2">{data.items.map(item => <Link key={item.version_id} href={`/decision-tools/${item.calculator_id}/review/${item.version_id}`} className="group flex min-w-0 flex-col rounded-xl border bg-card p-5 shadow-xs transition-colors hover:border-primary/40 hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0 flex-1"><p className="mb-1 text-xs font-medium text-muted-foreground">{formatStatus(item.tool_type)} · v{item.semantic_version}</p><h3 className="break-words text-base font-semibold group-hover:text-primary">{item.tool_name}</h3><p className="mt-1 text-sm text-muted-foreground">{item.clinical_owner || "No program area recorded"}</p></div><ToolStatusBadge status={item.version_status} /></div>
          <div className="mt-4 flex flex-wrap gap-2"><RiskLevelBadge level={item.tool_risk_level} /><Badge variant="outline">Validation {item.validation_passed ? "passed" : "required"}</Badge><Badge variant="outline">{item.fixture_passed_count}/{item.fixture_count} fixtures · {item.tests_passed ? "passed" : "tests required"}</Badge></div>
          <dl className="mt-4 grid gap-3 border-t pt-4 text-xs sm:grid-cols-2"><div className="min-w-0"><dt className="text-muted-foreground">Author</dt><dd className="mt-1 break-words font-medium">{item.author_id || "Not recorded"}</dd></div><div className="min-w-0"><dt className="text-muted-foreground">Reviewer</dt><dd className="mt-1 break-words font-medium">{item.reviewer_id || "Unassigned"}</dd></div></dl>
          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5 text-xs"><span className="text-muted-foreground">Parity evidence: {formatStatus(item.review_evidence_status)}</span><span className="flex items-center gap-2 font-medium">Open review<ArrowRight className="size-4" aria-hidden="true" /></span></div>
        </Link>)}</div>}
    </section>
    {!error && <TablePagination label="Review queue pages" page={page} pageSize={pageSize} totalItems={data?.total_items || 0} totalPages={data?.total_pages} loading={loading} onPageChange={setPage} onPageSizeChange={size => { setPageSize(size); setPage(1) }} />}
  </div>
}
