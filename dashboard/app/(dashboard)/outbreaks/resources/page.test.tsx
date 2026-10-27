import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
const loader = vi.hoisted(() => vi.fn());
vi.mock("./resource-data", () => ({ loadResourceGroups: loader }));
import OutbreakResourcesPage from "./page";
const groups = [
  { outbreak: { id: "cholera", title: "Cholera response" }, resources: [
    { id: "guide", title: "Clinical care manual", resource_type: "guideline", status: "published", issuing_organization: "Ministry of Health" },
    { id: "report", title: "Weekly update", resource_type: "situation_report", status: "pending_review" },
  ] },
  { outbreak: { id: "ebola", title: "Ebola response" }, resources: [
    { id: "sop", title: "Triage procedure", document_kind: "sop", resource_type: "guideline", status: "draft" },
  ] },
];
beforeEach(() => { loader.mockReset(); loader.mockResolvedValue(groups); });
afterEach(cleanup);
test("groups resources with readable types and direct management links", async () => {
  render(<OutbreakResourcesPage />);
  expect(await screen.findByRole("heading", { name: "Clinical care manual" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Cholera response" })).toBeInTheDocument();
  expect(screen.getByText("Situation report", { selector: "p" })).toBeInTheDocument();
  expect(screen.getByText("SOP", { selector: "p" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Manage resource: Weekly update" })).toHaveAttribute("href", "/outbreaks/cholera#resources");
});
test("combines search and filters and clears an empty result", async () => {
  render(<OutbreakResourcesPage />);
  await screen.findByRole("heading", { name: "Clinical care manual" });
  fireEvent.change(screen.getByLabelText("Search resources"), { target: { value: "Ministry of Health" } });
  fireEvent.change(screen.getByLabelText("Outbreak"), { target: { value: "cholera" } });
  fireEvent.change(screen.getByLabelText("Resource type"), { target: { value: "guideline" } });
  fireEvent.change(screen.getByLabelText("Status"), { target: { value: "published" } });
  expect(screen.getByRole("heading", { name: "Clinical care manual" })).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Weekly update" })).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Outbreak"), { target: { value: "ebola" } });
  expect(screen.getByText("No resources match your filters")).toBeInTheDocument();
  fireEvent.click(screen.getAllByRole("button", { name: "Clear filters" })[0]);
  expect(screen.getByRole("heading", { name: "Triage procedure" })).toBeInTheDocument();
  expect(screen.getByLabelText("Search resources")).toHaveValue("");
});
test("status summary cards filter the review queue", async () => {
  render(<OutbreakResourcesPage />);
  await screen.findByRole("heading", { name: "Weekly update" });
  fireEvent.click(screen.getByRole("button", { name: /Awaiting review/ }));
  expect(screen.getByLabelText("Status")).toHaveValue("pending_review");
  expect(screen.getByRole("heading", { name: "Weekly update" })).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Clinical care manual" })).not.toBeInTheDocument();
});
test("paginates large groups, resets on filtering and sorts titles", async () => {
  loader.mockResolvedValue([{ outbreak: { id: "one", title: "Response" }, resources: Array.from({ length: 13 }, (_, i) => ({
    id: `r-${i}`, title: `Resource ${String(i).padStart(2, "0")}`, status: i === 12 ? "draft" : "published", updated_at: `2026-10-${String(i + 1).padStart(2, "0")}T12:00:00Z`,
  })) }]);
  render(<OutbreakResourcesPage />);
  await screen.findByRole("heading", { name: "Resource 12" });
  const results = screen.getByRole("region", { name: "Resource results" });
  expect(within(results).getAllByRole("article")).toHaveLength(12);
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByRole("heading", { name: "Resource 00" })).toBeInTheDocument();
  expect(within(results).getAllByRole("article")).toHaveLength(1);
  fireEvent.click(screen.getByRole("button", { name: /Drafts/ }));
  expect(screen.getByRole("heading", { name: "Resource 12" })).toBeInTheDocument();
  expect(screen.getByRole("navigation", { name: "Resource pages" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: /All resources/ }));
  fireEvent.change(screen.getByLabelText("Sort within outbreaks"), { target: { value: "title" } });
  expect(within(results).getAllByRole("heading", { level: 3 })[0]).toHaveTextContent("Resource 00");
});
test("retries a failed load", async () => {
  loader.mockRejectedValueOnce(new Error("Connection unavailable"));
  render(<OutbreakResourcesPage />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Connection unavailable");
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findByRole("heading", { name: "Clinical care manual" })).toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
test("empty library explains how to add resources", async () => {
  loader.mockResolvedValue([]);
  render(<OutbreakResourcesPage />);
  expect(await screen.findByText("Build your outbreak resource library")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Choose an outbreak/ })).toHaveAttribute("href", "/outbreaks");
});

test("keeps every resource reachable when a page crosses outbreak groups", async () => {
  loader.mockResolvedValue([10, 7].map((count, group) => ({
    outbreak: { id: `o${group}`, title: `Outbreak ${group}` },
    resources: Array.from({ length: count }, (_, index) => ({ id: `g${group}-${index}`, title: `Group ${group} resource ${index}` })),
  })));
  render(<OutbreakResourcesPage />);
  await screen.findByRole("heading", { name: "Group 1 resource 0" });
  expect(screen.getAllByRole("article")).toHaveLength(12);
  expect(screen.queryByRole("heading", { name: "Group 1 resource 2" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getAllByRole("article")).toHaveLength(5);
  expect(screen.getByRole("heading", { name: "Group 1 resource 2" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Group 1 resource 6" })).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Outbreak 0" })).not.toBeInTheDocument();
});
