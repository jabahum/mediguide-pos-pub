import * as React from "react"
import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, expect, it, vi } from "vitest"
import type { RolePermissions } from "@/types/permissions"
const state = vi.hoisted(() => ({
  canEdit: true, initialized: true, error: null as Error | null,
  push: vi.fn(), update: vi.fn(), template: vi.fn(), load: vi.fn(), getRole: vi.fn(),
  validate: vi.fn(() => ({ isValid: true, errors: [], warnings: [] })), effective: vi.fn(() => ({})),
}))
const saved: RolePermissions = { users: { "read:any": ["*"] } }
const changed: RolePermissions = { users: { "read:any": ["*"], "update:any": ["*"] } }
vi.mock("next/navigation", () => ({ useParams: () => ({ id: "role-1" }), useRouter: () => ({ push: state.push }) }))
vi.mock("@/lib/permission-context", () => ({ usePermissionContext: () => ({ loading: false, hasPermission: (_resource: string, action: string) => action === "read:any" || state.canEdit }) }))
vi.mock("@/services/user-management.service", () => ({ rolesService: { get: state.getRole } }))
vi.mock("@/lib/toast", () => ({ showToast: { error: vi.fn(), success: vi.fn() } }))
vi.mock("@/hooks/use-permissions", () => ({ useRolePermissionManagement: function useMockRolePermissions() {
  const [rolePermissions, setRolePermissions] = React.useState(saved)
  return { rolePermissions, setRolePermissions, loadRolePermissions: state.load, updateRolePermissions: state.update,
    applyPermissionTemplate: state.template, validatePermissions: state.validate, getEffectivePermissions: state.effective,
    initialized: state.initialized, error: state.error }
} }))
vi.mock("@/components/ui/permission-builder", () => ({ PermissionBuilder: ({ permissions, onChange, disabled, showTemplates, onApplyTemplate }: { permissions: RolePermissions; onChange: (p: RolePermissions) => void; disabled: boolean; showTemplates: boolean; onApplyTemplate: (key: string) => void }) => <div><output aria-label="Builder permissions">{JSON.stringify(permissions)}</output><button disabled={disabled} onClick={() => onChange(changed)}>Edit test permissions</button><button disabled={disabled} onClick={() => onChange({})}>Clear test permissions</button>{showTemplates && <button disabled={disabled} onClick={() => onApplyTemplate("reviewer")}>Apply test template</button>}</div> }))
vi.mock("@/components/ui/permission-preview", () => ({ PermissionPreview: () => <div>Permission preview</div> }))
import RolePermissionsPage from "./page"
beforeEach(() => {
  state.canEdit = true; state.initialized = true; state.error = null
  state.getRole.mockResolvedValue({ id: "role-1", name: "Reviewer", key: "reviewer", isActive: true, created: "2026-10-01", updated: "2026-10-01" })
  state.update.mockResolvedValue({ success: true })
  state.template.mockResolvedValue({ success: true }); state.load.mockResolvedValue(changed)
})
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.restoreAllMocks() })

it("saves the edited permissions and keeps the saved values visible", async () => {
  render(<RolePermissionsPage />)
  await screen.findByRole("button", { name: "Edit test permissions" })
  await userEvent.click(screen.getByRole("button", { name: "Edit test permissions" }))
  await userEvent.click(screen.getByRole("button", { name: "Save Changes" }))
  await waitFor(() => expect(state.update).toHaveBeenCalledWith("role-1", changed))
  expect(screen.getByLabelText("Builder permissions")).toHaveTextContent(JSON.stringify(changed))
  expect(await screen.findByText("No unsaved changes")).toBeInTheDocument()
})
it("resets edits without persisting them", async () => {
  render(<RolePermissionsPage />)
  await userEvent.click(await screen.findByRole("button", { name: "Edit test permissions" }))
  await userEvent.click(screen.getByRole("button", { name: "Reset Changes" }))
  expect(screen.getByLabelText("Builder permissions")).toHaveTextContent(JSON.stringify(saved))
  expect(state.update).not.toHaveBeenCalled()
})
it("disables editing and hides save and template actions for read-only access", async () => {
  state.canEdit = false
  render(<RolePermissionsPage />)
  expect(await screen.findByRole("button", { name: "Edit test permissions" })).toBeDisabled()
  expect(screen.queryByRole("button", { name: "Save Changes" })).not.toBeInTheDocument()
  expect(screen.queryByRole("button", { name: "Apply test template" })).not.toBeInTheDocument()
})
it("keeps unsaved edits when navigation is declined", async () => {
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false)
  render(<RolePermissionsPage />)
  await userEvent.click(await screen.findByRole("button", { name: "Edit test permissions" }))
  await userEvent.click(screen.getByRole("link", { name: "User directory" }))
  expect(confirm).toHaveBeenCalled()
  expect(state.push).not.toHaveBeenCalled()
  expect(screen.getByLabelText("Builder permissions")).toHaveTextContent(JSON.stringify(changed))
})
it("shows an initialization error instead of leaving a permanent skeleton", async () => {
  state.initialized = false; state.error = new Error("Permissions unavailable")
  render(<RolePermissionsPage />)
  expect(await screen.findByText("Permissions unavailable")).toBeInTheDocument()
  expect(screen.queryByRole("status", { name: "Loading role permissions" })).not.toBeInTheDocument()
})
it("refreshes the saved permissions after applying a template", async () => {
  render(<RolePermissionsPage />)
  await userEvent.click(await screen.findByRole("button", { name: "Apply test template" }))
  await waitFor(() => expect(state.template).toHaveBeenCalledWith("role-1", "reviewer"))
  expect(await screen.findByText("No unsaved changes")).toBeInTheDocument()
  expect(screen.getByLabelText("Builder permissions")).toHaveTextContent(JSON.stringify(changed))
})
it("validates and saves an explicitly cleared permission set", async () => {
  render(<RolePermissionsPage />)
  await userEvent.click(await screen.findByRole("button", { name: "Clear test permissions" }))
  await userEvent.click(screen.getByRole("button", { name: "Save Changes" }))
  await waitFor(() => expect(state.update).toHaveBeenCalledWith("role-1", {}))
})
