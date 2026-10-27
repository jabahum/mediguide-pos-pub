"use client"

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { BookOpen, CheckCircle2, ClipboardCheck, Plus, RefreshCw, Search, X } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useDashboardRouter as useRouter } from "@/components/dialogs/create-dialog-context"

import { ConfirmDialog } from "@/components/dialogs/confirm-dialog"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { LoadingState } from "@/components/ui/loading-state"
import { GuidelineSectionHeader } from "@/components/guidelines/guideline-section"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { cn } from "@/lib/utils"
import { documentNeedsReview, isDocumentPublished, matchesLibraryState } from "./document-state"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { usePermissionContext } from "@/lib/permission-context"
import { hasBackendPermission } from "@/lib/backend-client"
import { showToast } from "@/lib/toast"
import {
  CreateGuidelineVersionInput,
  getDocumentLatestVersion,
  GuidelineDocumentRecord,
  GuidelineDocumentsService,
  GuidelineVersionRecord,
  guidelineDocumentsQueryKey,
  isPublishedAsLink,
  isPublishedAsUploaded,
} from "@/services/guideline-documents.service"
import { documentKindService, documentKindsQueryKey } from "@/services/document-kinds.service"
import { createGuidelinesColumns } from "./columns"
import {
  CreateVersionDialog,
  UploadVersionDialog,
  VersionLinkDialog,
} from "./components/guideline-version-dialogs"
import { GuidelineNotificationDialog } from "./components/guideline-notification-dialog"

const ALL_KINDS = "all"

export default function GuidelinesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const { hasPermission, loading: permissionsLoading } = usePermissionContext()
  const canUpdate = hasPermission("content", "update:any")
  const canNotify = hasBackendPermission("notification.campaign.manage")
  const canPublish = hasBackendPermission("guideline.publish")
  // Mirrors the DELETE /api/v2/guidelines/:id route guard.
  const canDelete = hasBackendPermission("guideline.write") && hasBackendPermission("guideline.publish")
  const [versionDocument, setVersionDocument] = React.useState<GuidelineDocumentRecord | null>(null)
  const [uploadVersion, setUploadVersion] = React.useState<GuidelineVersionRecord | null>(null)
  const [linkVersion, setLinkVersion] = React.useState<GuidelineVersionRecord | null>(null)
  const [notificationDocument, setNotificationDocument] = React.useState<GuidelineDocumentRecord | null>(null)
  const [deletingDocument, setDeletingDocument] = React.useState<GuidelineDocumentRecord | null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [publicationState, setPublicationState] = React.useState("")

  React.useEffect(() => {
    if (!permissionsLoading && !hasPermission("content", "read:any")) router.replace("/")
  }, [hasPermission, permissionsLoading, router])

  const documentsQuery = useQuery({
    queryKey: guidelineDocumentsQueryKey,
    queryFn: () => GuidelineDocumentsService.listDocuments(),
  })
  const kindsQuery = useQuery({
    queryKey: documentKindsQueryKey,
    queryFn: () => documentKindService.list(),
  })

  const documents = React.useMemo(() => documentsQuery.data?.items || [], [documentsQuery.data])
  // One filter option per active kind, plus any inactive kind that still has documents
  // so no document is unreachable from the filter.
  const kindOptions = React.useMemo(() => {
    const counts = new Map<string, number>()
    for (const document of documents) {
      if (document.document_kind_id) {
        counts.set(document.document_kind_id, (counts.get(document.document_kind_id) || 0) + 1)
      }
    }
    return (kindsQuery.data || [])
      .filter((kind) => kind.status === "active" || counts.has(kind.id))
      .map((kind) => ({ ...kind, count: counts.get(kind.id) || 0 }))
  }, [documents, kindsQuery.data])
  const selectedKind = kindOptions.find((kind) => kind.slug === searchParams.get("kind"))
  const visibleDocuments = React.useMemo(
    () => documents.filter((document) => {
      const query = search.trim().toLocaleLowerCase()
      return (!selectedKind || document.document_kind_id === selectedKind.id)
        && matchesLibraryState(document, publicationState)
        && (!query || [document.title, document.source_org, document.program_area, ...document.categories.map((category) => category.name)]
          .filter(Boolean).join(" ").toLocaleLowerCase().includes(query))
    }),
    [documents, selectedKind, search, publicationState]
  )

  function selectKind(slug: string) {
    router.replace(slug === ALL_KINDS ? "/guidelines" : `/guidelines?kind=${encodeURIComponent(slug)}`, { scroll: false })
  }

  const refresh = React.useCallback(
    () => queryClient.invalidateQueries({ queryKey: guidelineDocumentsQueryKey }),
    [queryClient]
  )

  const columns = React.useMemo(
    () =>
      createGuidelinesColumns({
        canUpdate,
        canNotify,
        canDelete,
        canPublish,
        onChanged: refresh,
        onView: (document) => router.push(`/guidelines/${document.id}`),
        onEdit: (document) => router.push(`/guidelines/${document.id}/edit`),
        onNewVersion: setVersionDocument,
        onUpload: (document) => {
          const version = getDocumentLatestVersion(document)
          if (!version) return
          // Link kinds take an https URL instead of a file.
          if (isPublishedAsLink(document)) setLinkVersion(version)
          else setUploadVersion(version)
        },
        onNotify: setNotificationDocument,
        onDelete: setDeletingDocument,
      }),
    [canDelete, canNotify, canPublish, canUpdate, refresh, router]
  )

  async function createVersion(payload: CreateGuidelineVersionInput) {
    if (!versionDocument) return
    setSubmitting(true)
    try {
      await GuidelineDocumentsService.createVersion(versionDocument.id, payload)
      setVersionDocument(null)
      await refresh()
      showToast.success("Version created", "The new version is ready for PDF or Markdown upload.")
    } catch (error) {
      showToast.error("Create version failed", error instanceof Error ? error.message : "Unknown error")
    } finally {
      setSubmitting(false)
    }
  }

  async function uploadSource(file: File, options?: import("@/services/guideline-upload.service").UploadOptions) {
    if (!uploadVersion) return
    setSubmitting(true)
    try {
      const job = await GuidelineDocumentsService.uploadVersionSource(uploadVersion.id, file, options)
      await refresh()
      const asUploaded = isPublishedAsUploaded(documents.find((document) => document.id === uploadVersion.document_id))
      showToast.success(
        asUploaded ? "Form stored" : "Source uploaded",
        asUploaded
          ? "The file is kept exactly as uploaded. Its text is being indexed for search."
          : "Document extraction and indexing have been queued."
      )
      return job
    } catch (error) {
      throw error
    } finally {
      setSubmitting(false)
    }
  }

  async function deleteGuideline() {
    if (!deletingDocument) return
    setSubmitting(true)
    try {
      await GuidelineDocumentsService.deleteDocument(deletingDocument.id)
      await refresh()
      showToast.success("Guideline deleted", `"${deletingDocument.title}" is no longer available to users.`)
    } catch (error) {
      showToast.error("Delete failed", error instanceof Error ? error.message : "Unknown error")
    } finally {
      setSubmitting(false)
    }
  }

  const loading = permissionsLoading || documentsQuery.isLoading
  const filtered = Boolean(search.trim() || selectedKind || publicationState)
  const clearFilters = () => { setSearch(""); setPublicationState(""); selectKind(ALL_KINDS) }
  const overview = [
    { label: "All documents", value: "", count: documents.length, icon: BookOpen, color: "bg-primary/10 text-primary" },
    { label: "Published", value: "published", count: documents.filter(isDocumentPublished).length, icon: CheckCircle2, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
    { label: "Needs review", value: "review", count: documents.filter(documentNeedsReview).length, icon: ClipboardCheck, color: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" },
    { label: "Withdrawn", value: "withdrawn", count: documents.filter((document) => document.withdrawn_at).length, icon: BookOpen, color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
  ]

  return (
    <div className="w-full min-w-0 space-y-6">
      <GuidelineSectionHeader
        title="Clinical guidelines"
        description="Find guidance, prepare new editions, and track review and publication progress."
        actions={
          [{ label: "Refresh", variant: "outline", icon: <RefreshCw className={cn("size-4", documentsQuery.isFetching && "animate-spin motion-reduce:animate-none")} />, onClick: () => { void refresh() }, disabled: documentsQuery.isFetching },
          ...(!permissionsLoading && hasPermission("content", "create:any")
            ? [{
                label: "Create Guideline",
                onClick: () => router.push("/guidelines/create"),
                icon: <Plus className="h-4 w-4" />,
              }]
            : [])]
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Guideline library overview">{overview.map(({ label, value, count, icon: Icon, color }) => <button key={label} type="button" aria-label={`Filter: ${label}`} aria-pressed={publicationState === value} disabled={loading || documentsQuery.isError} onClick={() => setPublicationState(value)} className={cn("flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default sm:p-5", publicationState === value && "border-primary/40 bg-primary/[0.025]")}><span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", color)}><Icon className="size-5" aria-hidden="true" /></span><span><span className="block text-2xl font-semibold tabular-nums">{loading || documentsQuery.isError ? "—" : count}</span><span className="block text-xs leading-5 text-muted-foreground sm:text-sm">{label}</span></span></button>)}</div>
      {loading ? <LoadingState message="Loading guideline documents..." /> : documentsQuery.isError ? (
        <div role="alert" className="rounded-xl border border-destructive/25 bg-destructive/5 p-6"><h2 className="font-semibold">Guidelines couldn’t be loaded</h2><p className="mt-2 text-sm text-muted-foreground">{documentsQuery.error instanceof Error ? documentsQuery.error.message : "Please try again."}</p><Button variant="outline" className="mt-4" onClick={() => { void documentsQuery.refetch() }}>Try again</Button></div>
      ) : <>
        <section aria-label="Filter guidelines" className="rounded-xl border bg-card p-4 shadow-xs sm:p-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr]">
            <div className="space-y-2 md:col-span-2 xl:col-span-1"><Label htmlFor="guideline-search" className="text-xs">Search documents</Label><div className="relative"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" /><Input id="guideline-search" type="search" className="h-10 rounded-lg pl-9" placeholder="Search title, source, or category…" value={search} onChange={(event) => setSearch(event.target.value)} /></div></div>
            <div className="space-y-2"><Label htmlFor="guideline-kind-filter" className="text-xs">Document kind</Label><Select value={selectedKind?.slug ?? ALL_KINDS} onValueChange={selectKind} disabled={kindsQuery.isLoading}><SelectTrigger id="guideline-kind-filter" className="h-10! w-full rounded-lg"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL_KINDS}>All kinds<Badge variant="secondary" className="px-1.5 tabular-nums">{documents.length}</Badge></SelectItem>{kindOptions.map((kind) => <SelectItem key={kind.id} value={kind.slug}>{kind.name}<Badge variant="secondary" className="px-1.5 tabular-nums">{kind.count}</Badge></SelectItem>)}</SelectContent></Select>{kindsQuery.isError && <p className="text-xs text-muted-foreground">Document kinds unavailable. <button className="underline underline-offset-2" onClick={() => { void kindsQuery.refetch() }}>Retry kinds</button></p>}</div>
            <div className="space-y-2"><Label htmlFor="guideline-state-filter" className="text-xs">Publication & review</Label><select id="guideline-state-filter" className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" value={publicationState} onChange={(event) => setPublicationState(event.target.value)}><option value="">All publication states</option><option value="published">Published</option><option value="unpublished">Not published</option><option value="review">Latest version needs review</option><option value="withdrawn">Withdrawn</option></select></div>
          </div>
          {filtered && <div className="mt-4 flex justify-end border-t pt-3"><Button variant="ghost" size="sm" onClick={clearFilters}><X className="mr-1.5 size-3.5" aria-hidden="true" />Clear filters</Button></div>}
        </section>
        {visibleDocuments.length ? <DataTable columns={columns} data={visibleDocuments} appearance="workspace" tableLabel="Guideline documents" recordLabel="documents" tableClassName="min-w-[960px]" initialSorting={[{ id: "updated_at", desc: true }]} toolbarContent={<p role="status" aria-live="polite" className="text-sm text-muted-foreground"><span className="font-medium text-foreground">{visibleDocuments.length} {visibleDocuments.length === 1 ? "document" : "documents"}</span>{filtered ? " match your filters" : " in the library"}</p>} /> : <div className="rounded-xl border border-dashed bg-card"><EmptyState icon={BookOpen} title={filtered ? "No documents match your filters" : "Start your clinical guideline library"} description={filtered ? "Try another title or source, or clear your filters to see all documents." : "Create a document to upload a source and prepare its first edition for review."} action={filtered ? { label: "Clear filters", onClick: clearFilters } : hasPermission("content", "create:any") ? { label: "Create Guideline", onClick: () => router.push("/guidelines/create") } : { label: "Refresh", onClick: () => { void refresh() } }} /></div>}
      </>}

      <CreateVersionDialog
        document={versionDocument}
        open={Boolean(versionDocument)}
        submitting={submitting}
        onOpenChange={(open) => !open && setVersionDocument(null)}
        onSubmit={createVersion}
      />
      <UploadVersionDialog
        version={uploadVersion}
        asUploaded={isPublishedAsUploaded(documents.find((document) => document.id === uploadVersion?.document_id))}
        open={Boolean(uploadVersion)}
        submitting={submitting}
        onOpenChange={(open) => !open && setUploadVersion(null)}
        onSubmit={uploadSource}
      />
      <VersionLinkDialog
        version={linkVersion}
        open={Boolean(linkVersion)}
        onOpenChange={(open) => !open && setLinkVersion(null)}
        onSaved={async () => {
          setLinkVersion(null)
          await refresh()
        }}
      />
      <GuidelineNotificationDialog
        document={notificationDocument}
        open={Boolean(notificationDocument)}
        onOpenChange={(open) => !open && setNotificationDocument(null)}
      />
      <ConfirmDialog
        open={Boolean(deletingDocument)}
        onOpenChange={(open) => !open && setDeletingDocument(null)}
        title="Delete guideline"
        description={`Delete "${deletingDocument?.title ?? ""}"? This removes it from the dashboard and public access. Use Withdraw to keep it in the dashboard for review and republication. Version history is kept for audit.`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={deleteGuideline}
        loading={submitting}
      />
    </div>
  )
}
