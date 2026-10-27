import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, expect, it, vi } from "vitest"
import type { RegionsResponse } from "@/types/backend-types"
import type { RowAction, BulkAction } from "@/types/data-table"
const state = vi.hoisted(() => ({ allowed: new Set<string>(), push: vi.fn(), replace: vi.fn() }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: state.push, replace: state.replace }) }))
vi.mock("@/lib/permission-context", () => ({ usePermissionContext: () => ({ loading: false, hasPermission: (_resource: string, action: string) => action === "read:any" || state.allowed.has(action) }) }))
vi.mock("@/components/ui/enhanced-backend-data-table", () => ({ EnhancedBackendDataTable: ({ rowActions, bulkActions }: { rowActions: RowAction<RegionsResponse>[]; bulkActions: BulkAction<RegionsResponse>[] }) => <div>{rowActions.map(action => <button key={action.id} onClick={() => action.onClick?.({ id: "region-1", name: "Central", nhpi_code: "NHPI-1", hsdt_code: "HSDT-1" } as RegionsResponse)}>{action.label}</button>)}{bulkActions.map(action => <button key={action.id}>{action.label}</button>)}</div> }))
import RegionsPage from "./page"
afterEach(() => { cleanup(); vi.clearAllMocks() })
function renderPage() {
  render(<QueryClientProvider client={new QueryClient()}><RegionsPage /></QueryClientProvider>)
}
it("shows a read-only reference directory without mutation actions", () => {
  state.allowed = new Set()
  renderPage()
  expect(screen.queryByRole("button", { name: "Add Region" })).not.toBeInTheDocument()
  expect(screen.queryByRole("button", { name: "Edit Region" })).not.toBeInTheDocument()
  expect(screen.queryByRole("button", { name: "Delete Region" })).not.toBeInTheDocument()
  expect(screen.queryByRole("button", { name: "Delete Selected" })).not.toBeInTheDocument()
})
it("allows reference editors to open create and edit dialogs without offering deletion", async () => {
  state.allowed = new Set(["create:any", "update:any"])
  renderPage()
  await userEvent.click(screen.getByRole("button", { name: "Edit Region" }))
  expect(await screen.findByRole("dialog", { name: "Edit Region" })).toBeInTheDocument()
  expect(screen.getByRole("textbox", { name: "Name *" })).toHaveValue("Central")
  await userEvent.click(screen.getByRole("button", { name: "Cancel" }))
  await userEvent.click(screen.getByRole("button", { name: "Add Region" }))
  expect(await screen.findByRole("dialog", { name: "Create Region" })).toBeInTheDocument()
  expect(screen.getByRole("textbox", { name: "Name *" })).toHaveValue("")
  expect(screen.queryByRole("button", { name: "Delete Region" })).not.toBeInTheDocument()
})
