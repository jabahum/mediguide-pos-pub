import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
const service = vi.hoisted(() => ({ list: vi.fn(), remove: vi.fn() }));
vi.mock("@/services/outbreaks.service", () => ({ situationReportsService: service }));
import SituationReportsPage from "./page";
const report = { id: "r1", title: "Week 43 report", status: "published", source_organization: "Ministry of Health", publication_date: "2026-10-26", lock_version: 1 };
beforeEach(() => { vi.clearAllMocks(); service.list.mockResolvedValue({ items: [report], total_items: 21, total_pages: 2 }); });
afterEach(cleanup);

test("shows source and verification context, and keeps the report route", async () => {
  render(<SituationReportsPage />);
  const table = await screen.findByRole("table", { name: "Situation reports" });
  expect(within(table).getByText("Ministry of Health")).toBeInTheDocument();
  expect(within(table).getByText("Not verified")).toBeInTheDocument();
  expect(within(table).getByRole("link", { name: "Open report: Week 43 report" })).toHaveAttribute("href", "/situation-reports/r1");
});

test("filters reports, resets pagination and uses supported sort fields", async () => {
  render(<SituationReportsPage />);
  await screen.findByRole("table", { name: "Situation reports" });
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  await waitFor(() => expect(service.list).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 })));
  fireEvent.click(screen.getByRole("button", { name: "Drafts" }));
  await waitFor(() => expect(service.list).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, status: "draft" })));
  fireEvent.change(screen.getByLabelText("Sort by"), { target: { value: "title" } });
  await waitFor(() => expect(service.list).toHaveBeenLastCalledWith(expect.objectContaining({ sort: "title", order: "asc" })));
  fireEvent.change(screen.getByLabelText("Search reports"), { target: { value: "Kampala" } });
  await waitFor(() => expect(service.list).toHaveBeenLastCalledWith(expect.objectContaining({ search: "Kampala" })));
});

test("distinguishes empty search results from an empty library and supports recovery", async () => {
  service.list.mockResolvedValue({ items: [], total_items: 0, total_pages: 0 });
  render(<SituationReportsPage />);
  await screen.findByText("No situation reports yet");
  fireEvent.change(screen.getByLabelText("Search reports"), { target: { value: "Missing" } });
  expect(await screen.findByText("No situation reports match your filters")).toBeInTheDocument();
  fireEvent.click(screen.getAllByRole("button", { name: "Clear filters" })[0]);
  expect(await screen.findByText("No situation reports yet")).toBeInTheDocument();
});

test("delete remains behind the existing confirmation dialog", async () => {
  const user = userEvent.setup();
  render(<SituationReportsPage />);
  const table = await screen.findByRole("table", { name: "Situation reports" });
  await user.click(within(table).getByRole("button", { name: "More actions for Week 43 report" }));
  await user.click(screen.getByRole("menuitem", { name: "Delete report" }));
  expect(await screen.findByRole("alertdialog")).toHaveTextContent("Week 43 report");
  expect(service.remove).not.toHaveBeenCalled();
});
