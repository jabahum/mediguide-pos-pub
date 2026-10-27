"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileStack, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { usePagination } from "@/hooks/use-client-pagination";
import { TablePagination } from "@/components/ui/table-pagination";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { GuidelineSectionHeader, GuidelineStatusBadge } from "@/components/guidelines/guideline-section";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { hasBackendPermission } from "@/lib/backend-client";
import { usePermissionContext } from "@/lib/permission-context";
import { showToast } from "@/lib/toast";
import { guidelineDocumentsQueryKey } from "@/services/guideline-documents.service";
import {
  DocumentKind,
  DocumentKindInput,
  documentKindService,
  documentKindsQueryKey,
} from "@/services/document-kinds.service";
import { DocumentKindDialog } from "./document-kind-dialog";

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unknown error";

export default function GuidelineDocumentKindsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission, loading: permissionsLoading } = usePermissionContext();
  // Mirrors the POST/PATCH/DELETE /api/v2/document-kinds route guards.
  const canManage = hasBackendPermission("guideline.write");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<DocumentKind | null>(null);
  const [deleting, setDeleting] = React.useState<DocumentKind | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    if (!permissionsLoading && !hasPermission("content", "read:any")) router.replace("/");
  }, [hasPermission, permissionsLoading, router]);

  const kindsQuery = useQuery({
    queryKey: documentKindsQueryKey,
    queryFn: () => documentKindService.list(),
  });

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: documentKindsQueryKey }),
      queryClient.invalidateQueries({ queryKey: guidelineDocumentsQueryKey }),
    ]);

  function openDialog(kind: DocumentKind | null) {
    setEditing(kind);
    setDialogOpen(true);
  }

  async function save(value: DocumentKindInput) {
    setSubmitting(true);
    try {
      if (editing) await documentKindService.update(editing.id, value);
      else await documentKindService.create(value);
      await refresh();
      setDialogOpen(false);
      showToast.success(
        editing ? "Document kind updated" : "Document kind added",
        `"${value.name.trim()}" has been saved.`,
      );
    } catch (error) {
      showToast.error("Document kind not saved", errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  async function remove() {
    if (!deleting) return;
    setSubmitting(true);
    try {
      await documentKindService.delete(deleting.id);
      await refresh();
      showToast.success("Document kind deleted", `"${deleting.name}" has been removed.`);
    } catch (error) {
      showToast.error("Delete failed", errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  const kinds = kindsQuery.data || [];
  const visibleKinds = kinds.filter((kind) => [kind.name, kind.slug, kind.description].filter(Boolean).join(" ").toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  const pagination = usePagination(visibleKinds);

  if (permissionsLoading || kindsQuery.isLoading) {
    return <LoadingState message="Loading document kinds..." />;
  }

  return (
    <div className="w-full min-w-0 space-y-6">
      <GuidelineSectionHeader
        title="Document Kinds"
        description="Organize document types and choose whether readers see structured content, a file, or a link."
        actions={
          canManage
            ? [{ label: "Add Document Kind", onClick: () => openDialog(null), icon: <Plus className="h-4 w-4" /> }]
            : []
        }
      />

      <section aria-label="Find document kinds" className="rounded-xl border bg-card p-4 shadow-xs sm:p-5"><label htmlFor="document-kind-search" className="mb-2 block text-xs font-medium">Search document kinds</label><div className="relative"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" /><Input id="document-kind-search" type="search" className="h-10 rounded-lg pl-9" placeholder="Search name, slug, or description…" value={search} onChange={(event) => { setSearch(event.target.value); pagination.setPage(1); }} /></div></section>
      {kindsQuery.isError ? (
        <div role="alert" className="rounded-xl border border-destructive/25 bg-destructive/5 p-6 text-sm text-destructive">
          {errorMessage(kindsQuery.error)}
          <Button variant="outline" className="mt-3 block" onClick={() => { void kindsQuery.refetch() }}>Try again</Button>
        </div>
      ) : kinds.length === 0 ? (
        <EmptyState
          icon={FileStack}
          title="No document kinds yet"
          description="Add a kind so guideline documents can be grouped."
          action={canManage ? { label: "Add Document Kind", onClick: () => openDialog(null) } : undefined}
        />
      ) : !visibleKinds.length ? <EmptyState icon={FileStack} title="No matching document kinds" description="Try another name or clear your search." action={{ label: "Clear search", onClick: () => setSearch("") }} /> : (
        <Card className="overflow-hidden rounded-xl shadow-xs">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-right">Guidelines</TableHead>
                  <TableHead className="text-right">Outbreak resources</TableHead>
                  <TableHead className="text-right">Sort order</TableHead>
                  <TableHead>Status</TableHead>
                  {canManage ? <TableHead className="w-[1%] text-right">Actions</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagination.visible.map((kind) => {
                  const inUse = kind.guideline_document_count + kind.outbreak_resource_count
                  return (
                  <TableRow key={kind.id} className="[&>td]:py-4">
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2 font-medium">
                        {canManage ? <button className="text-left font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => openDialog(kind)}>{kind.name}</button> : kind.name}
                        {kind.publish_as_uploaded ? (
                          <Badge variant="outline" className="font-normal">As uploaded</Badge>
                        ) : null}
                        {kind.publish_as_link ? (
                          <Badge variant="outline" className="font-normal">Link</Badge>
                        ) : null}
                      </div>
                      {kind.description ? (
                        <div className="text-sm text-muted-foreground">{kind.description}</div>
                      ) : null}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{kind.slug}</TableCell>
                    <TableCell className="text-right tabular-nums">{kind.guideline_document_count}</TableCell>
                    <TableCell className="text-right tabular-nums">{kind.outbreak_resource_count}</TableCell>
                    <TableCell className="text-right tabular-nums">{kind.sort_order}</TableCell>
                    <TableCell>
                      <GuidelineStatusBadge status={kind.status} />
                    </TableCell>
                    {canManage ? (
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openDialog(kind)}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit {kind.name}</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={inUse > 0}
                            title={
                              inUse > 0
                                ? `Move its ${inUse} document(s) to another kind before deleting`
                                : undefined
                            }
                            onClick={() => setDeleting(kind)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                            <span className="sr-only">Delete {kind.name}</span>
                          </Button>
                        </div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {!kindsQuery.isError && <TablePagination label="Document kind pages" page={pagination.page} pageSize={pagination.pageSize} totalItems={pagination.total} onPageChange={pagination.setPage} onPageSizeChange={pagination.setPageSize} />}
      <DocumentKindDialog
        open={dialogOpen}
        kind={editing}
        submitting={submitting}
        onOpenChange={setDialogOpen}
        onSubmit={save}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete document kind"
        description={`Delete "${deleting?.name ?? ""}"? It will no longer appear as a tab or be available for new documents.`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={remove}
        loading={submitting}
      />
    </div>
  );
}
