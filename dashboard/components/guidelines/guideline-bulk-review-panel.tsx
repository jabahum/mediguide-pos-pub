"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckSquare, Loader2, ShieldAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { TablePagination } from "@/components/ui/table-pagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { showToast } from "@/lib/toast";
import { BackendRequestError } from "@/lib/backend-client";
import {
  guidelineDocumentsQueryKey,
  GuidelineBlockType,
  GuidelineContentBlockRecord,
  GuidelineDocumentsService,
  GuidelineReviewBlocksFilter,
  GuidelineReviewBlocksPage,
  GuidelineSectionRecord,
} from "@/services/guideline-documents.service";

const confirmation =
  "I verified these blocks against the authoritative source.";

type Props = {
  versionId: string;
  sections: GuidelineSectionRecord[];
  eligibleTypes: GuidelineBlockType[];
  availableTypes: GuidelineBlockType[];
  onSelectBlock: (block: GuidelineContentBlockRecord) => void;
  onReviewed: () => void | Promise<void>;
};

export function GuidelineBulkReviewPanel({
  versionId,
  sections,
  eligibleTypes,
  availableTypes,
  onSelectBlock,
  onReviewed,
}: Props) {
  const queryClient = useQueryClient();
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(25);
  const [status, setStatus] = React.useState<NonNullable<GuidelineReviewBlocksFilter["status"]>>("all");
  const [risk, setRisk] = React.useState<NonNullable<GuidelineReviewBlocksFilter["risk"]>>("low-risk-pending");
  const [blockType, setBlockType] = React.useState<GuidelineBlockType | "all">("all");
  const [sectionId, setSectionId] = React.useState("");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [selectedBlocks, setSelectedBlocks] = React.useState<Map<string, GuidelineContentBlockRecord>>(new Map());
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [attested, setAttested] = React.useState(false);
  const [selectingSection, setSelectingSection] = React.useState(false);

  const filters = React.useMemo<GuidelineReviewBlocksFilter>(
    () => ({ page, per_page: perPage, status, risk, block_type: blockType, section_id: sectionId || undefined }),
    [blockType, page, perPage, risk, sectionId, status],
  );
  const query = useQuery({
    queryKey: [...guidelineDocumentsQueryKey, versionId, "review-blocks", filters],
    queryFn: () => GuidelineDocumentsService.getReviewBlocks(versionId, filters),
    enabled: Boolean(versionId),
  });
  const data = query.data;
  const eligible = React.useMemo(() => new Set(eligibleTypes), [eligibleTypes]);
  const selectable = (block: GuidelineContentBlockRecord) =>
    block.review_status === "draft" && eligible.has(block.type);

  // A refetch after approvals or another reviewer's changes can remove the
  // current last page. Adjust before rendering an out-of-range page.
  if (data && !query.isFetching && page > Math.max(1, data.total_pages)) {
    setPage(Math.max(1, data.total_pages));
  }

  function changeBlockType(value: string) {
    const nextType = value as GuidelineBlockType | "all";
    setPage(1);
    setBlockType(nextType);
    // A low-risk queue can never contain figures or other individually
    // reviewed types. Reveal them instead of leaving an impossible empty
    // filter combination on screen.
    if (
      nextType !== "all" &&
      !eligible.has(nextType) &&
      risk === "low-risk-pending"
    ) {
      setRisk("all");
    }
  }

  function setBlockSelected(block: GuidelineContentBlockRecord, checked: boolean) {
    if (!selectable(block)) return;
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(block.id);
      else next.delete(block.id);
      return next;
    });
    setSelectedBlocks((current) => {
      const next = new Map(current);
      if (checked) next.set(block.id, block);
      else next.delete(block.id);
      return next;
    });
  }

  function selectVisible() {
    for (const block of data?.items || []) setBlockSelected(block, true);
  }

  async function selectCurrentSection() {
    if (!sectionId) {
      showToast.error("Choose a section", "Select a section or chapter before selecting all of its low-risk blocks.");
      return;
    }
    setSelectingSection(true);
    try {
      const first = await GuidelineDocumentsService.getReviewBlocks(versionId, {
        page: 1, per_page: 100, risk: "low-risk-pending", block_type: blockType, section_id: sectionId,
      });
      const items = [...first.items];
      for (let nextPage = 2; nextPage <= first.total_pages; nextPage += 1) {
        const next = await GuidelineDocumentsService.getReviewBlocks(versionId, {
          page: nextPage, per_page: 100, risk: "low-risk-pending", block_type: blockType, section_id: sectionId,
        });
        items.push(...next.items);
        if (items.length > 500) break;
      }
      if (items.length > 500) {
        showToast.error("Selection too large", "Select a narrower block type; a bulk approval is limited to 500 blocks.");
        return;
      }
      for (const block of items) setBlockSelected(block, true);
    } catch (error) {
      showToast.error("Selection failed", error instanceof Error ? error.message : "Could not load this section.");
    } finally {
      setSelectingSection(false);
    }
  }

  const countsByType = React.useMemo(() => {
    const result = new Map<GuidelineBlockType, number>();
    for (const block of selectedBlocks.values()) result.set(block.type, (result.get(block.type) || 0) + 1);
    return [...result.entries()].sort(([left], [right]) => left.localeCompare(right));
  }, [selectedBlocks]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!data?.markdown_revision_id || !data.regeneration_job_id) {
        throw new Error("This projection has no current regeneration identity. Regenerate and refresh before bulk review.");
      }
      return GuidelineDocumentsService.bulkReviewBlocks(versionId, {
        block_ids: [...selected], status: "reviewed", confirmation,
        expected_markdown_revision_id: data.markdown_revision_id,
        expected_regeneration_job_id: data.regeneration_job_id,
      });
    },
    onSuccess: async (result) => {
      setConfirmOpen(false);
      setAttested(false);
      setSelected(new Set());
      setSelectedBlocks(new Map());
      await queryClient.invalidateQueries({ queryKey: [...guidelineDocumentsQueryKey, versionId] });
      await onReviewed();
      showToast.success("Low-risk blocks approved", `${result.reviewed_count} reviewed; ${result.skipped_count} already reviewed.`);
    },
    onError: (error) => {
      const result = error instanceof BackendRequestError
        ? error.meta as { reasons?: Array<{ message?: string }> } | undefined
        : undefined;
      const reason = result?.reasons?.[0]?.message;
      showToast.error("Bulk review failed", reason || (error instanceof Error ? error.message : "Refresh and try again."));
    },
  });

  const busy = query.isFetching || mutation.isPending || selectingSection;
  const pagination = (position: "top" | "bottom") => <BulkReviewPagination
    position={position} page={page} perPage={perPage} data={data} busy={busy}
    onPageChange={setPage} onPageSizeChange={value => { setPage(1); setPerPage(value); }}
  />;

  const progress = data?.progress;
  const metrics = progress
    ? [
        ["Total", progress.total_blocks], ["Reviewed", progress.reviewed_blocks],
        ["Pending low risk", progress.pending_low_risk_blocks], ["Pending high risk", progress.pending_high_risk_blocks],
        ["Rejected", progress.rejected_blocks], ["Reviewed sections", progress.sections_with_reviewed_content],
        ["Empty clinical leaves", progress.empty_clinical_leaf_sections],
      ] as const
    : [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between gap-3 text-base">
          <span className="flex items-center gap-2"><CheckSquare className="h-4 w-4" /> Bulk review queue</span>
          <Badge variant="outline">{selected.size} selected</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-7">
          {metrics.map(([label, value]) => <div className="rounded-md border p-2" key={label}><div className="text-lg font-semibold">{value}</div><div className="text-xs text-muted-foreground">{label}</div></div>)}
        </div>
        <div className="grid gap-2 md:grid-cols-4">
          <Filter label="Status" value={status} onChange={(value) => { setPage(1); setStatus(value as typeof status); }} options={["all", "pending", "reviewed", "rejected"]} />
          <Filter label="Risk" value={risk} onChange={(value) => { setPage(1); setRisk(value as typeof risk); }} options={["all", "low-risk-pending", "high-risk", "pending-high-risk"]} />
          <Filter label="Block type" value={blockType} onChange={changeBlockType} options={["all", ...availableTypes]} />
          <div><Label htmlFor="review-section-filter">Section or chapter</Label><select id="review-section-filter" className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-sm" value={sectionId} onChange={(event) => { setPage(1); setSectionId(event.target.value); }}><option value="">All sections</option>{sections.map((section) => <option key={section.id} value={section.id}>{"—".repeat(Math.max(0, section.level - 1))} {section.title}</option>)}</select></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={selectVisible} disabled={busy || !data?.items.some(selectable)}>Select visible low-risk blocks</Button>
          <Button size="sm" variant="outline" onClick={() => void selectCurrentSection()} disabled={busy || !sectionId}>{selectingSection && <Loader2 className="h-4 w-4 animate-spin" />} Select all low risk in section</Button>
          <Button size="sm" variant="ghost" onClick={() => { setSelected(new Set()); setSelectedBlocks(new Map()); }} disabled={busy || !selected.size}>Clear selection</Button>
          <Button size="sm" onClick={() => setConfirmOpen(true)} disabled={busy || !selected.size}>Approve selected low-risk blocks</Button>
        </div>
        <p className="text-xs text-muted-foreground">Selections are kept across pages and filters. “Select visible” selects eligible blocks on this page only.</p>
        {pagination("top")}
        {query.isLoading ? <div role="status" className="py-8 text-center text-sm text-muted-foreground">Loading review blocks…</div> : query.isError ? <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive p-3 text-sm text-destructive"><span>{query.error instanceof Error ? query.error.message : "Review blocks unavailable."}</span><Button size="sm" variant="outline" disabled={busy} onClick={() => void query.refetch()}>Try again</Button></div> : (
          <div key={JSON.stringify(filters)} role="region" aria-label="Bulk review blocks" tabIndex={0} aria-busy={query.isFetching} className="max-h-[60dvh] overflow-y-auto overscroll-contain divide-y rounded-md border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {(data?.items || []).map((block) => {
              const canSelect = selectable(block);
              return <div className="flex items-start gap-3 p-3" key={block.id}>
                {canSelect ? <Checkbox disabled={busy} aria-label={`Select ${block.type} block`} checked={selected.has(block.id)} onCheckedChange={(checked) => setBlockSelected(block, checked === true)} /> : <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-label="Individual review required" />}
                <button className="min-w-0 flex-1 text-left" type="button" onClick={() => onSelectBlock(block)}><div className="flex flex-wrap items-center gap-2"><span className="font-medium">{block.type.replaceAll("_", " ")}</span><Badge variant="outline">{block.review_status}</Badge>{!canSelect && block.review_status === "draft" && <Badge variant="secondary">individual review</Badge>}</div><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{blockSummary(block)}</p></button>
              </div>;
            })}
            {data?.items.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">No blocks match these filters.</div>}
          </div>
        )}
        {pagination("bottom")}
      </CardContent>

      <Dialog open={confirmOpen} onOpenChange={(open) => { setConfirmOpen(open); if (!open) setAttested(false); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Approve {selected.size} low-risk blocks?</DialogTitle><DialogDescription>This records your attestation against the exact Markdown revision and regenerated projection. Clinical and unknown blocks cannot be approved by this operation.</DialogDescription></DialogHeader>
          <div className="space-y-3"><div className="flex flex-wrap gap-2">{countsByType.map(([type, count]) => <Badge variant="outline" key={type}>{type.replaceAll("_", " ")}: {count}</Badge>)}</div><label className="flex items-start gap-3 rounded-md border p-3 text-sm"><Checkbox checked={attested} onCheckedChange={(checked) => setAttested(checked === true)} /><span>I verified every selected block against the authoritative source and confirm that its wording is faithful.</span></label></div>
          <DialogFooter><Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button><Button disabled={!attested || mutation.isPending} onClick={() => mutation.mutate()}>{mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Confirm approval</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function Filter({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  const id = `review-${label.toLowerCase().replaceAll(" ", "-")}`;
  return <div><Label htmlFor={id}>{label}</Label><select id={id} className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-sm" value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option} value={option}>{option.replaceAll("-", " ").replaceAll("_", " ")}</option>)}</select></div>;
}

function blockSummary(block: GuidelineContentBlockRecord) {
  const value = block.content.text || block.content.content || block.content.title || block.content.caption;
  if (typeof value === "string" && value.trim()) return value;
  if (Array.isArray(block.content.items)) return block.content.items.map(String).join(" · ");
  return "Structured block";
}

function BulkReviewPagination({ position, page, perPage, data, busy, onPageChange, onPageSizeChange }: {
  position: "top" | "bottom"; page: number; perPage: number; data?: GuidelineReviewBlocksPage; busy: boolean;
  onPageChange: (page: number) => void; onPageSizeChange: (size: number) => void;
}) {
  return <TablePagination label={`Bulk review pagination (${position})`} page={page} pageSize={perPage} totalItems={data?.total_items || 0} totalPages={data?.total_pages} count={data?.items.length || 0} loading={busy || !data} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} />;
}
