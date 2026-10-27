import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useSyncExternalStore, type ComponentProps } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ query: "", listeners: new Set<() => void>(), listTable: vi.fn(), push: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, replace: mocks.replace }),
  useSearchParams: () => new URLSearchParams(useSyncExternalStore(listener => { mocks.listeners.add(listener); return () => mocks.listeners.delete(listener); }, () => mocks.query)),
}));
vi.mock("next/link", () => ({ default: function Link({ href, children, ...props }: ComponentProps<"a">) {
  return <a {...props} href={href} onClick={event => { event.preventDefault(); mocks.query = new URL(href!, "https://dashboard.invalid").search; mocks.listeners.forEach(listener => listener()); }}>{children}</a>;
} }));
vi.mock("@/lib/permission-context", () => ({ usePermissionContext: () => ({ loading: false, hasPermission: (_resource: string, action: string) => action === "read:any" }) }));
vi.mock("@/lib/backend-client", () => ({ hasBackendPermission: () => false }));
vi.mock("@/hooks/use-tool-categories", () => ({ useToolCategories: () => ({ byId: new Map() }) }));
vi.mock("@/services/calculator.service", () => ({ calculatorService: { listTable: mocks.listTable } }));
import DecisionToolsPage from "./page";

const records = [
  { id: "calc", name: "BMI calculator", type: "calculator", status: "active", description: "Example calculator", version: "1" },
  { id: "decision", name: "Triage decision aid", type: "decision_tool", status: "active", description: "Example decision aid", version: "1" },
  { id: "check", name: "Safety checklist", type: "checklist", status: "active", description: "Example checklist", version: "1" },
];
beforeEach(() => {
  vi.clearAllMocks(); mocks.query = "";
  mocks.listTable.mockImplementation(async (query, type) => {
    const items = records.filter(record => (!type || record.type === type) && (!query.search || record.name.toLowerCase().includes(query.search.toLowerCase())));
    return { items, page: query.page, perPage: query.perPage, totalItems: items.length, totalPages: items.length ? 1 : 0 };
  });
});
afterEach(cleanup);
function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><DecisionToolsPage /></QueryClientProvider>);
  return client;
}
function chip(name: string) { return within(screen.getByRole("group", { name: "Filter tools by type" })).getByRole("link", { name }); }

it("switches each chip to its matching tools even after the unfiltered results are cached", async () => {
  mount();
  await screen.findByRole("link", { name: "BMI calculator" });
  expect(screen.getByRole("link", { name: "Triage decision aid" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Safety checklist" })).toBeInTheDocument();
  for (const [label, type, name] of [["Calculators", "calculator", "BMI calculator"], ["Decision tools", "decision_tool", "Triage decision aid"], ["Checklists", "checklist", "Safety checklist"]]) {
    fireEvent.click(chip(label));
    await screen.findByRole("link", { name });
    expect(chip(label)).toHaveAttribute("aria-current", "page");
    for (const record of records.filter(record => record.type !== type)) expect(screen.queryByRole("link", { name: record.name })).not.toBeInTheDocument();
    expect(mocks.listTable).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 }), type);
  }
  fireEvent.click(chip("All tools"));
  for (const record of records) expect(await screen.findByRole("link", { name: record.name })).toBeInTheDocument();
  fireEvent.click(chip("Calculators"));
  await screen.findByRole("link", { name: "BMI calculator" });
  expect(screen.queryByRole("link", { name: "Safety checklist" })).not.toBeInTheDocument();
});

it("opens a filtered URL directly, keeps search scoped to its type, and clears search on a chip change", async () => {
  mocks.query = "?type=checklist";
  mount();
  await screen.findByRole("link", { name: "Safety checklist" });
  expect(screen.queryByRole("link", { name: "BMI calculator" })).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole("searchbox", { name: "Search tools" }), { target: { value: "safety" } });
  await waitFor(() => expect(mocks.listTable).toHaveBeenLastCalledWith(expect.objectContaining({ search: "safety", page: 1 }), "checklist"));
  fireEvent.click(chip("Calculators"));
  await screen.findByRole("link", { name: "BMI calculator" });
  expect(mocks.listTable).toHaveBeenLastCalledWith(expect.objectContaining({ search: "", page: 1 }), "calculator");
});
