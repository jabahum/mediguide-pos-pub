import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"
const state = vi.hoisted(() => ({ permissions: new Set<string>() }))
vi.mock("@/lib/backend-client", () => ({ hasBackendPermission: (permission: string) => state.permissions.has(permission) }))
import SettingsPage from "./page"
afterEach(cleanup)
it("offers Firebase configuration to administrators with configuration-only access", () => {
  state.permissions = new Set(["firebase.config.manage"])
  render(<SettingsPage />)
  expect(screen.getByRole("link", { name: /Review channel health/ })).toHaveAttribute("href", "/settings/firebase")
  expect(screen.queryByRole("link", { name: /Manage notice templates/ })).not.toBeInTheDocument()
})
it("offers notification operations through a keyboard-accessible link", () => {
  state.permissions = new Set(["notification.template.read"])
  render(<SettingsPage />)
  expect(screen.getByRole("link", { name: /Manage notice templates/ })).toHaveAttribute("href", "/settings/notifications")
  expect(screen.queryByRole("link", { name: /Review channel health/ })).not.toBeInTheDocument()
})
it("shows an explicit empty state when no configuration areas are accessible", () => {
  state.permissions = new Set()
  render(<SettingsPage />)
  expect(screen.getByText("No settings available")).toBeInTheDocument()
  expect(screen.queryByRole("link", { name: "Firebase" })).not.toBeInTheDocument()
})
