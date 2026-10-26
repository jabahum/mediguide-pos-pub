import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
const service = vi.hoisted(() => ({ list: vi.fn(), delete: vi.fn() }));
const diseases = vi.hoisted(() => ({ list: vi.fn() }));
vi.mock("@/services/outbreaks.service", () => ({ outbreaksService: service }));
vi.mock("@/services/content-hubs.service", () => ({ diseaseService: diseases }));
import OutbreaksPage from "./page";
const outbreak = { id: "o1", title: "Cholera response", status: "active", disease_name: "Cholera", geographic_area: "Kampala", lock_version: 1 };
beforeEach(() => {
  vi.clearAllMocks();
  service.list.mockResolvedValue({ items: [outbreak], total_items: 21, total_pages: 2 });
  diseases.list.mockResolvedValue({ items: [{ id: "d1", name: "Cholera" }] });
});
afterEach(cleanup);

test("preserves all advanced filters and sorts titles in ascending order", async () => {
  render(<OutbreaksPage />);
  await screen.findByRole("table", { name: "Outbreaks" });
  fireEvent.click(screen.getByRole("button", { name: "More filters" }));
  expect(screen.getByRole("button", { name: "More filters" })).toHaveAttribute("aria-expanded", "true");
  fireEvent.change(screen.getByLabelText("Geographic area"), { target: { value: "Gulu" } });
  fireEvent.change(screen.getByLabelText("Visual tone"), { target: { value: "critical" } });
  fireEvent.change(screen.getByLabelText("Effective from"), { target: { value: "2026-10-01" } });
  fireEvent.change(screen.getByLabelText("Updated from"), { target: { value: "2026-10-02" } });
  fireEvent.change(screen.getByLabelText("Disease"), { target: { value: "d1" } });
  fireEvent.change(screen.getByLabelText("Sort by"), { target: { value: "title" } });
  await waitFor(() => expect(service.list).toHaveBeenLastCalledWith(expect.objectContaining({ area: "Gulu", visual_tone: "critical", disease: "d1", sort: "title", order: "asc", effective_from: expect.any(String), updated_from: expect.any(String) })));
  fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
  await waitFor(() => {
    const query = service.list.mock.lastCall?.[0];
    expect(query).toMatchObject({ page: 1, sort: "title" });
    expect(query.area).toBeUndefined();
    expect(query.disease).toBeUndefined();
    expect(query.visual_tone).toBeUndefined();
  });
});

test("status shortcuts reset pagination and search uses the server", async () => {
  render(<OutbreaksPage />);
  await screen.findByRole("table", { name: "Outbreaks" });
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  await waitFor(() => expect(service.list).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 })));
  fireEvent.click(screen.getByRole("button", { name: "Awaiting review" }));
  await waitFor(() => expect(service.list).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, status: "pending_review" })));
  fireEvent.change(screen.getByLabelText("Search outbreaks"), { target: { value: "cholera" } });
  await waitFor(() => expect(service.list).toHaveBeenLastCalledWith(expect.objectContaining({ search: "cholera", page: 1 })));
});

test("failed requests offer retry without displaying stale records", async () => {
  service.list.mockRejectedValueOnce(new Error("Offline"));
  render(<OutbreaksPage />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Offline");
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findByRole("table", { name: "Outbreaks" })).toBeInTheDocument();
});

test("secondary delete action opens the existing confirmation without deleting immediately", async () => {
  const user = userEvent.setup();
  render(<OutbreaksPage />);
  const table = await screen.findByRole("table", { name: "Outbreaks" });
  await user.click(within(table).getByRole("button", { name: "More actions for Cholera response" }));
  await user.click(screen.getByRole("menuitem", { name: "Delete outbreak" }));
  expect(await screen.findByRole("alertdialog")).toHaveTextContent("Cholera response");
  expect(service.delete).not.toHaveBeenCalled();
});
