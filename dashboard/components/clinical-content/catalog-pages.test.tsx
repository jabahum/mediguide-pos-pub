import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ diseaseList: vi.fn(), hubList: vi.fn(), create: vi.fn(), update: vi.fn(), archive: vi.fn(), manage: true }));
vi.mock("@/lib/backend-client", () => ({ hasBackendPermission: () => mocks.manage }));
vi.mock("@/lib/toast", () => ({ showToast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/services/content-hubs.service", () => ({ diseaseService: { list: mocks.diseaseList, create: mocks.create, update: mocks.update, archive: mocks.archive }, contentHubService: { list: mocks.hubList } }));
import DiseasesPage from "@/app/(dashboard)/diseases/page";
import ContentHubsPage from "@/app/(dashboard)/content-hubs/page";

const disease = { id: "cholera", name: "Cholera", slug: "cholera", status: "active", sort_order: 0, aliases: [{ alias: "Vibrio infection" }], codes: [{ code_system: "ICD-10", code: "A00" }] };
const hub = { id: "hub-1", name: "Cholera care", status: "published", description: "Resources for cholera response", diseases: [disease], outbreaks: [{ id: "outbreak-1", title: "Kampala response" }], audience: "all", published_at: "2026-10-20" };
const page = (items: unknown[], current = 1, total = 21) => ({ items, page: current, per_page: 20, total_items: total, total_pages: Math.ceil(total / 20) });
beforeEach(() => {
  vi.clearAllMocks(); mocks.manage = true;
  mocks.diseaseList.mockResolvedValue(page([disease]));
  mocks.hubList.mockResolvedValue(page([hub]));
  mocks.create.mockResolvedValue(disease);
});
afterEach(cleanup);

it("shows disease classification and requests server pages and filters", async () => {
  render(<DiseasesPage />);
  expect(await screen.findByRole("table")).toBeInTheDocument();
  expect(screen.getByText("Vibrio infection")).toBeInTheDocument();
  expect(screen.getByText("ICD-10: A00")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  await waitFor(() => expect(mocks.diseaseList).toHaveBeenLastCalledWith("", "", { page: 2, per_page: 20 }));
  await screen.findByRole("table");
  fireEvent.click(screen.getByRole("button", { name: "Archived" }));
  await waitFor(() => expect(mocks.diseaseList).toHaveBeenLastCalledWith("", "archived", { page: 1, per_page: 20 }));
  await screen.findByRole("table");
  fireEvent.click(screen.getByRole("button", { name: "Archived" }));
  expect(screen.getByRole("table")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
  await waitFor(() => expect(mocks.diseaseList).toHaveBeenLastCalledWith("", "", { page: 1, per_page: 20 }));
});

it("keeps all active parent choices available while editing a filtered directory", async () => {
  mocks.diseaseList.mockImplementation((_search, _status, pagination) => {
    if (pagination?.per_page === 20) return Promise.resolve(page([disease]));
    return Promise.resolve({ ...page([{ ...disease, id: pagination?.page === 2 ? "parent-2" : "parent-1", name: pagination?.page === 2 ? "Second parent" : "First parent" }]), total_pages: 2 });
  });
  render(<DiseasesPage />);
  fireEvent.click(await screen.findByRole("button", { name: "Edit Cholera" }));
  const dialog = within(screen.getByRole("dialog"));
  expect(await dialog.findByRole("option", { name: "Second parent" })).toBeInTheDocument();
  expect(dialog.getByLabelText("Canonical name")).toHaveValue("Cholera");
  fireEvent.click(dialog.getByRole("button", { name: "Cancel" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("creates a disease from the dialog and closes it after saving", async () => {
  render(<DiseasesPage />);
  await screen.findByRole("table");
  fireEvent.click(screen.getByRole("button", { name: "New disease" }));
  const dialog = within(screen.getByRole("dialog"));
  expect(dialog.getByRole("button", { name: "Save disease" })).toBeDisabled();
  fireEvent.change(dialog.getByLabelText("Canonical name"), { target: { value: "Measles" } });
  fireEvent.click(dialog.getByRole("button", { name: "Save disease" }));
  await waitFor(() => expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ name: "Measles" })));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
});

it("preserves read-only disease access", async () => {
  mocks.manage = false;
  render(<DiseasesPage />);
  await screen.findByRole("table");
  expect(screen.queryByRole("button", { name: /New disease|Edit Cholera|Archive Cholera/ })).not.toBeInTheDocument();
});

it("shows hub scope and publication details and resets pagination on search", async () => {
  render(<ContentHubsPage />);
  expect(await screen.findByRole("link", { name: "Manage hub: Cholera care" })).toHaveAttribute("href", "/content-hubs/hub-1");
  expect(screen.getByText("Kampala response")).toBeInTheDocument();
  expect(screen.getByText("Cholera", { exact: true })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  await waitFor(() => expect(mocks.hubList).toHaveBeenLastCalledWith({ search: "", status: "", page: 2, per_page: 20 }));
  await screen.findByRole("link", { name: "Manage hub: Cholera care" });
  fireEvent.change(screen.getByRole("textbox", { name: "Search content hubs" }), { target: { value: "cholera" } });
  await waitFor(() => expect(mocks.hubList).toHaveBeenLastCalledWith({ search: "cholera", status: "", page: 1, per_page: 20 }));
  await screen.findByRole("link", { name: "Manage hub: Cholera care" });
  fireEvent.click(screen.getByRole("button", { name: "Drafts" }));
  await waitFor(() => expect(mocks.hubList).toHaveBeenLastCalledWith({ search: "cholera", status: "draft", page: 1, per_page: 20 }));
});

it("keeps hub viewing available without management actions", async () => {
  mocks.manage = false;
  render(<ContentHubsPage />);
  expect(await screen.findByRole("link", { name: "View hub: Cholera care" })).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "New hub" })).not.toBeInTheDocument();
});

it("recovers from hub list failures through retry", async () => {
  mocks.hubList.mockRejectedValueOnce(new Error("Service unavailable"));
  render(<ContentHubsPage />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Service unavailable");
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findByRole("link", { name: "Manage hub: Cholera care" })).toBeInTheDocument();
});

it("offers filter reset when a status has no matching diseases", async () => {
  mocks.diseaseList.mockResolvedValue(page([], 1, 0));
  render(<DiseasesPage />);
  await screen.findByText("No diseases yet");
  fireEvent.click(screen.getByRole("button", { name: "Archived" }));
  expect(await screen.findByText("No matching diseases")).toBeInTheDocument();
  fireEvent.click(screen.getAllByRole("button", { name: "Clear filters" })[0]);
  await waitFor(() => expect(mocks.diseaseList).toHaveBeenLastCalledWith("", "", { page: 1, per_page: 20 }));
});

it("resets the disease request to page one when rows per page changes", async () => {
  render(<DiseasesPage />);
  await screen.findByRole("table");
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  await waitFor(() => expect(mocks.diseaseList).toHaveBeenLastCalledWith("", "", { page: 2, per_page: 20 }));
  await screen.findByRole("table");
  fireEvent.change(screen.getByLabelText("Rows per page"), { target: { value: "50" } });
  await waitFor(() => expect(mocks.diseaseList).toHaveBeenLastCalledWith("", "", { page: 1, per_page: 50 }));
});

it("sends the selected content hub page size to the server and resets the page", async () => {
  render(<ContentHubsPage />);
  await screen.findByRole("link", { name: "Manage hub: Cholera care" });
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  await waitFor(() => expect(mocks.hubList).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2, per_page: 20 })));
  await screen.findByRole("link", { name: "Manage hub: Cholera care" });
  fireEvent.change(screen.getByLabelText("Rows per page"), { target: { value: "50" } });
  await waitFor(() => expect(mocks.hubList).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, per_page: 50 })));
});
