import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"
import type { BulkAction, RowAction } from "@/types/data-table"
import type { HealthFacility } from "./columns"
const state = vi.hoisted(() => ({ allowed: false, push: vi.fn(), replace: vi.fn() }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: state.push, replace: state.replace }) }))
vi.mock("@/lib/permission-context", () => ({ usePermissionContext: () => ({ loading: false, hasPermission: (_resource: string, action: string) => action === "read:any" || state.allowed }) }))
vi.mock("@/components/ui/enhanced-backend-data-table", () => ({ EnhancedBackendDataTable: ({ rowActions, bulkActions }: { rowActions: RowAction<HealthFacility>[]; bulkActions: BulkAction<HealthFacility>[] }) => <div>{rowActions.map(action => <button key={action.id}>{action.label}</button>)}{bulkActions.map(action => <button key={action.id}>{action.label}</button>)}</div> }))
import HealthFacilitiesPage from "./page"
afterEach(cleanup)
it("offers read and export actions without mutation or placeholder actions to read-only users", () => {
  state.allowed = false
  render(<HealthFacilitiesPage />)
  expect(screen.getByRole("button", { name: "View Details" })).toBeInTheDocument()
  expect(screen.getByRole("button", { name: "Copy Codes" })).toBeInTheDocument()
  expect(screen.getByRole("button", { name: "Export Selected" })).toBeInTheDocument()
  for (const name of ["Edit Facility", "Delete Facility", "Add Health Facility", "Archive Facility", "View on Map", "Generate Report", "Archive Selected", "Generate Reports", "View All on Map"]) expect(screen.queryByRole("button", { name })).not.toBeInTheDocument()
})
it("offers create, edit and delete actions to users with the corresponding permissions", () => {
  state.allowed = true
  render(<HealthFacilitiesPage />)
  for (const name of ["Add Health Facility", "Edit Facility", "Delete Facility"]) expect(screen.getByRole("button", { name })).toBeInTheDocument()
})
