import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
const mocks = vi.hoisted(() => ({ listTable: vi.fn(), push: vi.fn(), replace: vi.fn(), hasPermission: vi.fn(() => true) }));
vi.mock("next/navigation", () => ({ usePathname: () => "/drugs", useRouter: () => ({ push: mocks.push, replace: mocks.replace }) }));
vi.mock("@/lib/permission-context", () => ({ usePermissionContext: () => ({ loading: false, hasPermission: mocks.hasPermission }) }));
vi.mock("@/services/drug.service", () => ({ drugService: { listTable: mocks.listTable } }));
import DrugsPage from "./page";

const drug = { id: "d1", name: "Example medication", brand_names: "Example brand", status: "active", review_status: "pending", expand: { categories: [
  { id: "c1", name: "Category one" }, { id: "c2", name: "Category two" }, { id: "c3", name: "Category three" },
] } };
function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><DrugsPage /></QueryClientProvider>);
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.hasPermission.mockReturnValue(true);
  mocks.listTable.mockResolvedValue({ items: [drug], page: 1, perPage: 20, totalItems: 1, totalPages: 1 });
});
afterEach(cleanup);

test("shows drug identity, brand and lifecycle/review status without opening hidden columns", async () => {
  mount();
  expect(await screen.findByRole("link", { name: "Example medication" })).toHaveAttribute("href", "/drugs/d1");
  expect(screen.getByText("Example brand")).toBeInTheDocument();
  expect(screen.getByText("Active")).toBeInTheDocument();
  expect(screen.getByText("Pending")).toBeInTheDocument();
  expect(screen.getByRole("navigation", { name: "Drug index sections" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Categories" })).toHaveAttribute("href", "/drugs/categories");
});

test("search reaches the existing paginated data loader", async () => {
  mount();
  await screen.findByText("Example medication");
  fireEvent.change(screen.getByRole("searchbox", { name: "Search drugs" }), { target: { value: "Example brand" } });
  await waitFor(() => expect(mocks.listTable).toHaveBeenLastCalledWith(expect.objectContaining({ search: "Example brand", page: 1 })));
});

test("category overflow retains access to every category", async () => {
  const user = userEvent.setup();
  mount();
  await screen.findByText("Category one");
  expect(screen.queryByText("Category three")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "View all 3 categories for Example medication" }));
  expect(await screen.findByText("Category three")).toBeInTheDocument();
});

test("creation remains controlled by the existing permission", async () => {
  mocks.hasPermission.mockImplementation((_resource?: string, action?: string) => action !== "create:any");
  mount();
  await screen.findByText("Example medication");
  expect(screen.queryByRole("button", { name: "Add Drug" })).not.toBeInTheDocument();
});
