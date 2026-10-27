import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GuidelineBulkReviewPanel } from "./guideline-bulk-review-panel";
import { BackendRequestError } from "@/lib/backend-client";
import { showToast } from "@/lib/toast";
import { GuidelineDocumentsService } from "@/services/guideline-documents.service";

vi.mock("@/lib/toast", () => ({
  showToast: { success: vi.fn(), error: vi.fn() },
}));

const paragraph = {
  id: "block-paragraph",
  version_id: "version-1",
  section_id: "section-1",
  type: "paragraph" as const,
  sort_order: 1,
  content: { type: "paragraph", text: "Verified prose" },
  review_status: "draft" as const,
};
const table = {
  ...paragraph,
  id: "block-table",
  type: "table" as const,
  sort_order: 2,
  content: { type: "table", title: "Clinical doses" },
};

describe("GuidelineBulkReviewPanel", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(GuidelineDocumentsService, "getReviewBlocks").mockResolvedValue({
      items: [paragraph, table],
      page: 1,
      per_page: 25,
      total_items: 2,
      total_pages: 1,
      markdown_revision_id: "revision-1",
      regeneration_job_id: "job-1",
      progress: {
        total_blocks: 12,
        reviewed_blocks: 4,
        pending_low_risk_blocks: 6,
        pending_high_risk_blocks: 2,
        rejected_blocks: 0,
        sections_with_reviewed_content: 3,
        empty_clinical_leaf_sections: 5,
      },
    });
  });

  afterEach(cleanup);

  it("filters, reports progress, and excludes high-risk blocks from selection", async () => {
    const getReviewBlocks = vi.mocked(GuidelineDocumentsService.getReviewBlocks);
    const user = userEvent.setup();
    renderPanel();
    expect(await screen.findByText("Pending low risk")).toBeInTheDocument();
    expect(screen.getByLabelText("Status")).toBeInTheDocument();
    expect(screen.getByLabelText("Risk")).toBeInTheDocument();
    expect(screen.getByLabelText("Block type")).toBeInTheDocument();
    expect(screen.getByLabelText("Section or chapter")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Select paragraph block" })).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "Select table block" })).not.toBeInTheDocument();
    expect(screen.getByText("individual review")).toBeInTheDocument();
    expectMetric("Total", "12");
    expectMetric("Reviewed", "4");
    expectMetric("Pending low risk", "6");
    expectMetric("Pending high risk", "2");
    expectMetric("Rejected", "0");
    expectMetric("Reviewed sections", "3");
    expectMetric("Empty clinical leaves", "5");

    await user.selectOptions(screen.getByLabelText("Status"), "pending");
    await user.selectOptions(screen.getByLabelText("Risk"), "pending-high-risk");
    await user.selectOptions(screen.getByLabelText("Block type"), "paragraph");
    await user.selectOptions(screen.getByLabelText("Section or chapter"), "section-1");
    await waitFor(() => expect(getReviewBlocks).toHaveBeenCalledWith("version-1", {
      page: 1,
      per_page: 25,
      status: "pending",
      risk: "pending-high-risk",
      block_type: "paragraph",
      section_id: "section-1",
    }));
  });

  it("clears the incompatible low-risk filter when figures are selected", async () => {
    const getReviewBlocks = vi.mocked(GuidelineDocumentsService.getReviewBlocks);
    const user = userEvent.setup();
    renderPanel();
    await screen.findByText("Pending low risk");

    await user.selectOptions(screen.getByLabelText("Block type"), "figure");

    expect(screen.getByLabelText("Risk")).toHaveValue("all");
    await waitFor(() =>
      expect(getReviewBlocks).toHaveBeenCalledWith("version-1", {
        page: 1,
        per_page: 25,
        status: "all",
        risk: "all",
        block_type: "figure",
        section_id: undefined,
      }),
    );
  });

  it("loads every page when selecting low-risk blocks in the current section", async () => {
    const user = userEvent.setup();
    const secondParagraph = { ...paragraph, id: "block-paragraph-2", sort_order: 2 };
    vi.mocked(GuidelineDocumentsService.getReviewBlocks).mockImplementation(async (_versionId, filters) => {
      if (filters.per_page === 100) {
        return {
          items: filters.page === 1 ? [paragraph] : [secondParagraph],
          page: filters.page || 1,
          per_page: 100,
          total_items: 2,
          total_pages: 2,
          markdown_revision_id: "revision-1",
          regeneration_job_id: "job-1",
          progress: {
            total_blocks: 2, reviewed_blocks: 0, pending_low_risk_blocks: 2,
            pending_high_risk_blocks: 0, rejected_blocks: 0,
            sections_with_reviewed_content: 0, empty_clinical_leaf_sections: 1,
          },
        };
      }
      return {
        items: [paragraph], page: 1, per_page: 25, total_items: 1, total_pages: 1,
        markdown_revision_id: "revision-1", regeneration_job_id: "job-1",
        progress: {
          total_blocks: 2, reviewed_blocks: 0, pending_low_risk_blocks: 2,
          pending_high_risk_blocks: 0, rejected_blocks: 0,
          sections_with_reviewed_content: 0, empty_clinical_leaf_sections: 1,
        },
      };
    });
    renderPanel();
    await screen.findByRole("checkbox", { name: "Select paragraph block" });
    await user.selectOptions(screen.getByLabelText("Section or chapter"), "section-1");
    await user.click(screen.getByRole("button", { name: "Select all low risk in section" }));
    await waitFor(() => expect(screen.getByText("2 selected")).toBeInTheDocument());
    expect(GuidelineDocumentsService.getReviewBlocks).toHaveBeenCalledWith("version-1", {
      page: 1, per_page: 100, risk: "low-risk-pending", block_type: "all", section_id: "section-1",
    });
    expect(GuidelineDocumentsService.getReviewBlocks).toHaveBeenCalledWith("version-1", {
      page: 2, per_page: 100, risk: "low-risk-pending", block_type: "all", section_id: "section-1",
    });
  });

  it("requires attestation and sends exact revision identities", async () => {
    const user = userEvent.setup();
    const bulkReview = vi.spyOn(GuidelineDocumentsService, "bulkReviewBlocks").mockResolvedValue({
      reviewed_count: 1, skipped_count: 0, rejected_count: 0,
      reviewed_ids: [paragraph.id], skipped_ids: [], reasons: [],
    });
    renderPanel();
    await user.click(await screen.findByRole("checkbox", { name: "Select paragraph block" }));
    await user.click(screen.getByRole("button", { name: "Approve selected low-risk blocks" }));
    const dialog = screen.getByRole("dialog", { name: "Approve 1 low-risk blocks?" });
    const confirm = within(dialog).getByRole("button", { name: "Confirm approval" });
    expect(confirm).toBeDisabled();
    await user.click(within(dialog).getByRole("checkbox"));
    await user.click(confirm);
    await waitFor(() => expect(bulkReview).toHaveBeenCalledWith("version-1", {
      block_ids: [paragraph.id],
      status: "reviewed",
      confirmation: "I verified these blocks against the authoritative source.",
      expected_markdown_revision_id: "revision-1",
      expected_regeneration_job_id: "job-1",
    }));
  });

  it("surfaces structured stale-review failure guidance without partial success", async () => {
    const user = userEvent.setup();
    vi.spyOn(GuidelineDocumentsService, "bulkReviewBlocks").mockRejectedValue(
      new BackendRequestError("guideline bulk review rejected", 422, undefined, {
        reviewed_count: 0,
        rejected_count: 1,
        reasons: [{ code: "stale_markdown_revision", message: "The Markdown changed. Refresh the review workspace." }],
      }),
    );
    renderPanel();
    await user.click(await screen.findByRole("checkbox", { name: "Select paragraph block" }));
    await user.click(screen.getByRole("button", { name: "Approve selected low-risk blocks" }));
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("checkbox"));
    await user.click(within(dialog).getByRole("button", { name: "Confirm approval" }));
    await waitFor(() => expect(showToast.error).toHaveBeenCalledWith(
      "Bulk review failed",
      "The Markdown changed. Refresh the review workspace.",
    ));
  });

  it("shows ranges and supports first, previous, next and last page navigation", async () => {
    mockPaginatedQueue();
    const user = userEvent.setup();
    renderPanel();
    await screen.findByText("Block 1");
    const top = screen.getByRole("navigation", { name: "Bulk review pagination (top)" });
    expect(within(top).getByText("Showing 1 to 25 of 63 results")).toBeInTheDocument();
    expect(within(top).getByRole("button", { name: "First page" })).toBeDisabled();
    expect(within(top).getByRole("button", { name: "Previous" })).toBeDisabled();
    await user.click(within(top).getByRole("button", { name: "Next" }));
    await screen.findByText("Block 26");
    expect(within(top).getByText("Showing 26 to 50 of 63 results")).toBeInTheDocument();
    await user.click(within(top).getByRole("button", { name: "Last page" }));
    await screen.findByText("Block 51");
    expect(within(top).getByText("Showing 51 to 63 of 63 results")).toBeInTheDocument();
    expect(within(top).getByRole("button", { name: "Next" })).toBeDisabled();
    expect(within(top).getByRole("button", { name: "Last page" })).toBeDisabled();
    await user.click(within(top).getByRole("button", { name: "Previous" }));
    await screen.findByText("Block 26");
    await user.click(within(top).getByRole("button", { name: "First page" }));
    await screen.findByText("Block 1");
    await user.click(within(top).getByRole("button", { name: "Last page" }));
    await screen.findByText("Block 51");
    expect(GuidelineDocumentsService.getReviewBlocks).toHaveBeenLastCalledWith("version-1", expect.objectContaining({ page: 3, per_page: 25 }));
    expect(within(screen.getByRole("navigation", { name: "Bulk review pagination (bottom)" })).getByText("Page 3 of 3")).toBeInTheDocument();
  });

  it("resets to the first page for page-size and filter changes without fetching the old page", async () => {
    mockPaginatedQueue();
    const user = userEvent.setup();
    renderPanel();
    await screen.findByText("Block 1");
    const top = screen.getByRole("navigation", { name: "Bulk review pagination (top)" });
    await user.click(within(top).getByRole("button", { name: "Next" }));
    await screen.findByText("Block 26");
    await user.selectOptions(within(top).getByLabelText("Rows per page"), "10");
    await screen.findByText("Block 1");
    expect(within(top).getByText("Showing 1 to 10 of 63 results")).toBeInTheDocument();
    expect(screen.getAllByLabelText("Rows per page").every(select => (select as HTMLSelectElement).value === "10")).toBe(true);
    expect(GuidelineDocumentsService.getReviewBlocks).not.toHaveBeenCalledWith("version-1", expect.objectContaining({ page: 2, per_page: 10 }));
    await user.click(within(top).getByRole("button", { name: "Next" }));
    await screen.findByText("Block 11");
    await user.selectOptions(screen.getByLabelText("Status"), "pending");
    await screen.findByText("Block 1");
    expect(GuidelineDocumentsService.getReviewBlocks).toHaveBeenLastCalledWith("version-1", expect.objectContaining({ page: 1, per_page: 10, status: "pending" }));
    expect(GuidelineDocumentsService.getReviewBlocks).not.toHaveBeenCalledWith("version-1", expect.objectContaining({ page: 2, status: "pending" }));
  });

  it("retains selections across pages while Select visible only selects the current page", async () => {
    mockPaginatedQueue();
    const user = userEvent.setup();
    renderPanel();
    await screen.findByText("Block 1");
    await user.click(screen.getByRole("button", { name: "Select visible low-risk blocks" }));
    expect(screen.getByText("25 selected")).toBeInTheDocument();
    const top = screen.getByRole("navigation", { name: "Bulk review pagination (top)" });
    await user.click(within(top).getByRole("button", { name: "Next" }));
    await screen.findByText("Block 26");
    const secondPageCheckboxes = screen.getAllByRole("checkbox", { name: "Select paragraph block" });
    expect(secondPageCheckboxes.every(checkbox => checkbox.getAttribute("aria-checked") === "false")).toBe(true);
    await user.click(secondPageCheckboxes[0]);
    expect(screen.getByText("26 selected")).toBeInTheDocument();
    await user.click(within(top).getByRole("button", { name: "First page" }));
    await screen.findByText("Block 1");
    expect(screen.getAllByRole("checkbox", { name: "Select paragraph block" }).every(checkbox => checkbox.getAttribute("aria-checked") === "true")).toBe(true);
    expect(screen.getByText("26 selected")).toBeInTheDocument();
  });

  it("disables pagination and selection while the next page is loading", async () => {
    const queue = mockPaginatedQueue();
    let finish!: (value: ReturnType<typeof queue.response>) => void;
    vi.mocked(GuidelineDocumentsService.getReviewBlocks).mockImplementation((_version, filters) => filters.page === 2
      ? new Promise(resolve => { finish = resolve; })
      : Promise.resolve(queue.response(filters)));
    const user = userEvent.setup();
    renderPanel();
    await screen.findByText("Block 1");
    const top = screen.getByRole("navigation", { name: "Bulk review pagination (top)" });
    await user.click(within(top).getByRole("button", { name: "Next" }));
    expect(screen.getByText("Loading review blocks…")).toBeInTheDocument();
    expect(within(top).getByRole("button", { name: "Next" })).toBeDisabled();
    expect(within(top).getByLabelText("Rows per page")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Select visible low-risk blocks" })).toBeDisabled();
    await act(async () => finish(queue.response({ page: 2, per_page: 25 })));
    expect(await screen.findByText("Block 26")).toBeInTheDocument();
    expect(within(top).getByRole("button", { name: "Next" })).toBeEnabled();
  });

  it("reports empty results without an invalid range or enabled next page", async () => {
    mockPaginatedQueue(0);
    renderPanel();
    await screen.findByText("No blocks match these filters.");
    const top = screen.getByRole("navigation", { name: "Bulk review pagination (top)" });
    expect(within(top).getByText("Showing 0 to 0 of 0 results")).toBeInTheDocument();
    expect(within(top).getByText("Page 1 of 1")).toBeInTheDocument();
    expect(within(top).getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("lets a failed page be retried without losing the selected page", async () => {
    const queue = mockPaginatedQueue();
    let failed = false;
    vi.mocked(GuidelineDocumentsService.getReviewBlocks).mockImplementation(async (_version, filters) => {
      if (filters.page === 2 && !failed) { failed = true; throw new Error("Page unavailable"); }
      return queue.response(filters);
    });
    const user = userEvent.setup();
    renderPanel();
    await screen.findByText("Block 1");
    await user.click(within(screen.getByRole("navigation", { name: "Bulk review pagination (top)" })).getByRole("button", { name: "Next" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Page unavailable");
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Block 26")).toBeInTheDocument();
    expect(GuidelineDocumentsService.getReviewBlocks).toHaveBeenLastCalledWith("version-1", expect.objectContaining({ page: 2 }));
  });

  it("moves to the last remaining page after approvals shrink the queue", async () => {
    const queue = mockPaginatedQueue();
    vi.spyOn(GuidelineDocumentsService, "bulkReviewBlocks").mockImplementation(async (_version, input) => {
      queue.blocks = queue.blocks.filter(block => !input.block_ids.includes(block.id));
      return { reviewed_count: input.block_ids.length, skipped_count: 0, rejected_count: 0, reviewed_ids: input.block_ids, skipped_ids: [], reasons: [] };
    });
    const user = userEvent.setup();
    renderPanel();
    await screen.findByText("Block 1");
    const top = screen.getByRole("navigation", { name: "Bulk review pagination (top)" });
    await user.click(within(top).getByRole("button", { name: "Last page" }));
    await screen.findByText("Block 51");
    await user.click(screen.getByRole("button", { name: "Select visible low-risk blocks" }));
    await user.click(screen.getByRole("button", { name: "Approve selected low-risk blocks" }));
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("checkbox"));
    await user.click(within(dialog).getByRole("button", { name: "Confirm approval" }));
    await waitFor(() => expect(within(top).getByText("Page 2 of 2")).toBeInTheDocument());
    expect(within(top).getByText("Showing 26 to 50 of 50 results")).toBeInTheDocument();
    expect(within(top).getByRole("button", { name: "Next" })).toBeDisabled();
  });

});

function renderPanel() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <GuidelineBulkReviewPanel
        versionId="version-1"
        sections={[{ id: "section-1", version_id: "version-1", title: "Care", slug: "care", level: 2, html: "", text: "", sort_order: 1 }]}
        eligibleTypes={["paragraph", "heading", "ordered_list", "unordered_list", "reference", "page_break"]}
        availableTypes={["paragraph", "heading", "ordered_list", "unordered_list", "table", "figure", "reference", "page_break", "unknown"]}
        onSelectBlock={vi.fn()}
        onReviewed={vi.fn()}
      />
    </QueryClientProvider>,
  );
}

function expectMetric(label: string, value: string) {
  const metric = screen.getByText(label).parentElement;
  expect(metric).not.toBeNull();
  expect(within(metric as HTMLElement).getByText(value)).toBeInTheDocument();
}

function mockPaginatedQueue(total = 63) {
  const queue = {
    blocks: Array.from({ length: total }, (_, index) => ({ ...paragraph, id: `block-${index + 1}`, sort_order: index + 1, content: { type: "paragraph", text: `Block ${index + 1}` } })),
    response(filters: { page?: number; per_page?: number }) {
      const page = filters.page || 1;
      const perPage = filters.per_page || 25;
      return {
        items: queue.blocks.slice((page - 1) * perPage, page * perPage), page, per_page: perPage,
        total_items: queue.blocks.length, total_pages: Math.ceil(queue.blocks.length / perPage),
        markdown_revision_id: "revision-1", regeneration_job_id: "job-1",
        progress: { total_blocks: queue.blocks.length, reviewed_blocks: 0, pending_low_risk_blocks: queue.blocks.length, pending_high_risk_blocks: 0, rejected_blocks: 0, sections_with_reviewed_content: 0, empty_clinical_leaf_sections: 0 },
      };
    },
  };
  vi.mocked(GuidelineDocumentsService.getReviewBlocks).mockImplementation(async (_version, filters) => queue.response(filters));
  return queue;
}
