import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"
const access = vi.hoisted(() => ({ permissions: new Set<string>() }))
vi.mock("@/lib/backend-client", () => ({ hasBackendPermission: (permission: string) => access.permissions.has(permission) }))
import { OutbreakSectionNavigation } from "./outbreak-section-navigation"
import { outbreakLandingPath, type OutbreakSection } from "@/lib/outbreak-navigation"
afterEach(cleanup)
it.each([["outbreaks", "Outbreaks", "/outbreaks"], ["reports", "Situation reports", "/situation-reports"], ["resources", "Outbreak resources", "/outbreaks/resources"]])("marks the active %s page and retains all authorized destination URLs", (section, label, href) => {
  access.permissions = new Set(["outbreak.read", "situation_report.read"])
  render(<OutbreakSectionNavigation section={section as OutbreakSection} />)
  expect(screen.getByRole("link", { name: label })).toHaveAttribute("href", href)
  expect(screen.getByRole("link", { name: label })).toHaveAttribute("aria-current", "page")
  expect(screen.getAllByRole("link")).toHaveLength(3)
  expect(screen.getAllByRole("link").filter(link => link.hasAttribute("aria-current"))).toHaveLength(1)
})
it("shows only report navigation to report-only readers", () => {
  access.permissions = new Set(["situation_report.read"])
  render(<OutbreakSectionNavigation section="reports" />)
  expect(screen.getByRole("link", { name: "Situation reports" })).toHaveAttribute("href", "/situation-reports")
  expect(screen.queryByRole("link", { name: "Outbreaks" })).not.toBeInTheDocument()
  expect(screen.queryByRole("link", { name: "Outbreak resources" })).not.toBeInTheDocument()
  expect(outbreakLandingPath(permission => access.permissions.has(permission))).toBe("/situation-reports")
})
it("shows outbreaks and resource navigation to outbreak-only readers", () => {
  access.permissions = new Set(["outbreak.read"])
  render(<OutbreakSectionNavigation section="resources" />)
  expect(screen.getByRole("link", { name: "Outbreaks" })).toBeInTheDocument()
  expect(screen.getByRole("link", { name: "Outbreak resources" })).toHaveAttribute("aria-current", "page")
  expect(screen.queryByRole("link", { name: "Situation reports" })).not.toBeInTheDocument()
  expect(outbreakLandingPath(permission => access.permissions.has(permission))).toBe("/outbreaks")
})
it("does not expose navigation when neither read permission is granted", () => {
  access.permissions = new Set()
  render(<OutbreakSectionNavigation section="outbreaks" />)
  expect(screen.queryByRole("navigation", { name: "Outbreak management sections" })).not.toBeInTheDocument()
})
