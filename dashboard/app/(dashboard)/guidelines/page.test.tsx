import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import * as backend from "@/lib/backend-client";
import { GuidelineDocumentsService, type GuidelineDocumentRecord, type GuidelineVersionRecord } from "@/services/guideline-documents.service";
import { documentKindService, type DocumentKind } from "@/services/document-kinds.service";

const mocks = vi.hoisted(() => ({ query: "", push: vi.fn(), replace: vi.fn(), hasPermission: vi.fn<(resource: string, action: string) => boolean>(() => true), backendPermission: vi.fn<(permission: string) => boolean>(() => true) }));
vi.mock("next/navigation", () => ({ usePathname: () => "/guidelines", useRouter: () => ({ push: mocks.push, replace: mocks.replace }), useSearchParams: () => new URLSearchParams(mocks.query) }));
vi.mock("@/lib/permission-context", () => ({ usePermissionContext: () => ({ loading: false, hasPermission: mocks.hasPermission }) }));
vi.mock("./components/guideline-publication-action", () => ({ GuidelinePublicationAction: () => null }));
vi.mock("./components/guideline-notification-dialog", () => ({ GuidelineNotificationDialog: () => null }));
vi.mock("./components/guideline-version-dialogs", () => ({
  CreateVersionDialog: () => null,
  UploadVersionDialog: ({ open, version, asUploaded }: { open: boolean; version: GuidelineVersionRecord | null; asUploaded?: boolean }) => open ? <div role="dialog">Upload source for {version?.id}: {asUploaded ? "original file" : "structured content"}</div> : null,
  VersionLinkDialog: ({ open, version }: { open: boolean; version: GuidelineVersionRecord | null }) => open ? <div role="dialog">Link target for {version?.id}</div> : null,
}));
import GuidelinesPage from "./page";

function kind(id: string, slug: string, status: "active" | "inactive" = "active"): DocumentKind {
  return { id, slug, name: slug.toUpperCase(), status, description: "", sort_order: 1, publish_as_uploaded: false, publish_as_link: slug === "link", guideline_document_count: 1, outbreak_resource_count: 0 };
}
function version(id: string, status: string): GuidelineVersionRecord {
  return { id, document_id: id.split("-")[0], version: id, status, created_at: "2026-10-01", updated_at: "2026-10-01" };
}
const kinds = [kind("k1", "guideline"), kind("k2", "sop", "inactive"), kind("k3", "link")];
const documents: GuidelineDocumentRecord[] = [
  { id: "published", title: "Clinical care handbook", source_org: "Ministry of Health", document_kind_id: "k1", document_kind: kinds[0], current_version_id: "published-v1", versions: [version("published-v2", "review_required"), version("published-v1", "published")], categories: [{ id: "cat1", name: "Emergency care", status: "active" }], created_at: "2026-10-01", updated_at: "2026-10-02" },
  { id: "draft", title: "Referral SOP", source_org: "District team", document_kind_id: "k2", document_kind: kinds[1], versions: [version("draft-v1", "draft")], categories: [], created_at: "2026-10-01", updated_at: "2026-10-03" },
  { id: "withdrawn", title: "Withdrawn protocol", withdrawn_at: "2026-10-20", document_kind_id: "k1", document_kind: kinds[0], versions: [version("withdrawn-v1", "published")], categories: [], created_at: "2026-10-01", updated_at: "2026-10-04" },
  { id: "link", title: "Response portal", document_kind_id: "k3", document_kind: kinds[2], versions: [version("link-v1", "draft")], categories: [], created_at: "2026-10-01", updated_at: "2026-10-05" },
];
function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><GuidelinesPage /></QueryClientProvider>);
}
beforeEach(() => {
  vi.clearAllMocks(); mocks.query = "";
  mocks.hasPermission.mockReturnValue(true); mocks.backendPermission.mockReturnValue(true);
  vi.spyOn(backend, "hasBackendPermission").mockImplementation(mocks.backendPermission);
  vi.spyOn(GuidelineDocumentsService, "listDocuments").mockResolvedValue({ items: documents, page: 1, per_page: 100, total_items: documents.length, total_pages: 1 });
  vi.spyOn(documentKindService, "list").mockResolvedValue(kinds);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

test("searches document sources and categories and clears an empty result", async () => {
  mount();
  await screen.findByRole("table", { name: "Guideline documents" });
  fireEvent.change(screen.getByLabelText("Search documents"), { target: { value: "Emergency care" } });
  expect(screen.getByRole("button", { name: "Open guideline: Clinical care handbook" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Open guideline: Referral SOP" })).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Search documents"), { target: { value: "District team" } });
  expect(screen.getByRole("button", { name: "Open guideline: Referral SOP" })).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Search documents"), { target: { value: "Missing" } });
  expect(screen.getByText("No documents match your filters")).toBeInTheDocument();
  fireEvent.click(screen.getAllByRole("button", { name: "Clear filters" })[0]);
  expect(screen.getByRole("button", { name: "Open guideline: Response portal" })).toBeInTheDocument();
  expect(mocks.replace).toHaveBeenCalledWith("/guidelines", { scroll: false });
});

test("keeps a published edition discoverable while its working edition needs review", async () => {
  mount(); await screen.findByRole("table", { name: "Guideline documents" });
  fireEvent.click(screen.getByRole("button", { name: "Filter: Published" }));
  expect(screen.getByRole("button", { name: "Open guideline: Clinical care handbook" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Open guideline: Withdrawn protocol" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Filter: Needs review" }));
  expect(screen.getByRole("button", { name: "Open guideline: Clinical care handbook" })).toBeInTheDocument();
  expect(screen.getByText("Working vpublished-v2")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Publication & review"), { target: { value: "unpublished" } });
  expect(screen.queryByRole("button", { name: "Open guideline: Withdrawn protocol" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Open guideline: Referral SOP" })).toBeInTheDocument();
});

test("retains bookmarked kind filters, including inactive kinds with documents", async () => {
  mocks.query = "kind=sop";
  mount();
  await screen.findByRole("button", { name: "Open guideline: Referral SOP" });
  expect(screen.queryByRole("button", { name: "Open guideline: Response portal" })).not.toBeInTheDocument();
  await waitFor(() => expect(screen.getByRole("combobox", { name: "Document kind" })).toHaveTextContent("SOP"));
});

test("readers can open documents without seeing authoring or deletion actions", async () => {
  mocks.hasPermission.mockImplementation((_resource, action) => action === "read:any");
  mocks.backendPermission.mockReturnValue(false);
  mount(); await screen.findByRole("table", { name: "Guideline documents" });
  expect(screen.queryByRole("button", { name: "Create Guideline" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /More actions for/ })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Open guideline: Referral SOP" }));
  expect(mocks.push).toHaveBeenCalledWith("/guidelines/draft");
});

test("link kinds still open their link dialog instead of the source upload dialog", async () => {
  const user = userEvent.setup();
  mount(); await screen.findByRole("table", { name: "Guideline documents" });
  await user.click(screen.getByRole("button", { name: "More actions for Response portal" }));
  await user.click(screen.getByRole("menuitem", { name: "Set link" }));
  expect(screen.getByRole("dialog")).toHaveTextContent("Link target for link-v1");
});

test("deletion still requires the existing confirmation", async () => {
  const remove = vi.spyOn(GuidelineDocumentsService, "deleteDocument").mockResolvedValue(undefined);
  const user = userEvent.setup();
  mount(); await screen.findByRole("table", { name: "Guideline documents" });
  await user.click(screen.getByRole("button", { name: "More actions for Referral SOP" }));
  await user.click(screen.getByRole("menuitem", { name: "Delete guideline" }));
  expect(await screen.findByRole("alertdialog")).toHaveTextContent('Delete "Referral SOP"');
  expect(remove).not.toHaveBeenCalled();
});

test("original-file kinds keep their upload route", async () => {
  const form = { ...documents[1], id: "form", title: "Reporting form", document_kind: { ...kinds[1], publish_as_uploaded: true }, versions: [version("form-v1", "draft")] };
  vi.mocked(GuidelineDocumentsService.listDocuments).mockResolvedValue({ items: [form], page: 1, per_page: 100, total_items: 1, total_pages: 1 });
  const user = userEvent.setup();
  mount(); await screen.findByRole("table", { name: "Guideline documents" });
  await user.click(screen.getByRole("button", { name: "More actions for Reporting form" }));
  await user.click(screen.getByRole("menuitem", { name: "Upload source" }));
  expect(screen.getByRole("dialog")).toHaveTextContent("Upload source for form-v1: original file");
});

test("a failed library request can be retried", async () => {
  vi.mocked(GuidelineDocumentsService.listDocuments).mockRejectedValueOnce(new Error("Network unavailable"));
  mount();
  expect(await screen.findByRole("alert")).toHaveTextContent("Network unavailable");
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findByRole("table", { name: "Guideline documents" })).toBeInTheDocument();
});

test("a retained published edition without a current publication is not presented as live", async () => {
  const retained = { ...documents[0], current_version_id: null, versions: [version("retained-v1", "published")] };
  vi.mocked(GuidelineDocumentsService.listDocuments).mockResolvedValue({ items: [retained], page: 1, per_page: 100, total_items: 1, total_pages: 1 });
  const user = userEvent.setup();
  mount(); await screen.findByRole("table", { name: "Guideline documents" });
  expect(screen.getByText("Previously published")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "More actions for Clinical care handbook" }));
  expect(screen.getByRole("menuitem", { name: "Create notification campaign" })).toHaveAttribute("aria-disabled", "true");
  await user.keyboard("{Escape}");
  fireEvent.click(screen.getByRole("button", { name: "Filter: Published" }));
  expect(screen.getByText("No documents match your filters")).toBeInTheDocument();
});

test("accepted content is distinct from publication and no longer queued for review", async () => {
  const accepted = { ...documents[1], versions: [{ ...version("draft-v2", "review_required"), structured_content_status: "approved" }] };
  vi.mocked(GuidelineDocumentsService.listDocuments).mockResolvedValue({ items: [accepted], page: 1, per_page: 100, total_items: 1, total_pages: 1 });
  mount(); await screen.findByRole("table", { name: "Guideline documents" });
  expect(screen.getByText("Content approved")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Filter: Needs review" }));
  expect(screen.getByText("No documents match your filters")).toBeInTheDocument();
  fireEvent.click(screen.getAllByRole("button", { name: "Clear filters" })[0]);
  fireEvent.click(screen.getByRole("button", { name: "Filter: Published" }));
  expect(screen.getByText("No documents match your filters")).toBeInTheDocument();
});
