import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, expect, it, vi } from "vitest"
const state = vi.hoisted(() => ({ canEdit: true, canReadRoles: true, record: {} as Record<string, unknown>, loading: false }))
const router = { push: vi.fn() }
vi.mock("next/navigation", () => ({ useRouter: () => router, useParams: () => ({ id: "user-1" }) }))
vi.mock("@/hooks/use-domain-record", () => ({ useDomainRecord: () => ({ record: state.record, loading: state.loading, error: null }) }))
vi.mock("@/lib/permission-context", () => ({ usePermissionContext: () => ({ hasPermission: (resource: string, action: string) => action === "read:any" ? resource !== "roles" || state.canReadRoles : state.canEdit }) }))
import UserProfilePage from "./page"
beforeEach(() => {
  state.canEdit = true; state.canReadRoles = true; state.loading = false
  state.record = { id: "user-1", name: "Alice Clinical", email: "alice@example.test", phone: "+256700000000", role: "healthcare_provider", status: "pendingActivation", email_verified: true, verified: false, organization: "District Hospital", postalCode: "12345", notes: "Review pending", created: "2026-10-01T12:00:00Z", updated: "2026-10-27T10:00:00Z" }
})
afterEach(cleanup)
it("distinguishes pending activation, verified email and administrator approval", () => {
  render(<UserProfilePage />)
  expect(screen.getByText("Pending activation")).toBeInTheDocument()
  expect(screen.getByText("Email verified")).toBeInTheDocument()
  expect(screen.getByText("Account not approved")).toBeInTheDocument()
  expect(screen.getByRole("link", { name: "alice@example.test" })).toHaveAttribute("href", "mailto:alice@example.test")
  expect(screen.getByRole("link", { name: "+256700000000" })).toHaveAttribute("href", "tel:+256700000000")
  expect(screen.getByText("12345")).toBeInTheDocument()
  expect(screen.getByText("Review pending")).toBeInTheDocument()
})
it("only offers editing and role navigation when permitted", () => {
  state.canEdit = false; state.canReadRoles = false
  render(<UserProfilePage />)
  expect(screen.queryByRole("button", { name: "Edit user" })).not.toBeInTheDocument()
  expect(screen.queryByRole("link", { name: "Roles & permissions" })).not.toBeInTheDocument()
  expect(screen.getByRole("link", { name: "User directory" })).toBeInTheDocument()
})
it("keeps section navigation available while the profile loads", () => {
  state.loading = true
  render(<UserProfilePage />)
  expect(screen.getByRole("status")).toHaveTextContent("Loading user profile")
  expect(screen.getByRole("link", { name: "User directory" })).toHaveAttribute("href", "/users")
})
