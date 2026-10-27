import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, expect, it, vi } from "vitest"
const access = vi.hoisted(() => ({ pathname: "/", all: true, loading: false, client: new Set<string>(), backend: new Set<string>() }))
vi.mock("next/navigation", () => ({ usePathname: () => access.pathname }))
vi.mock("@/lib/permission-context", () => ({ usePermissionContext: () => ({ loading: access.loading, hasPermission: (resource: string, action: string) => access.all || access.client.has(`${resource}:${action}`) }) }))
vi.mock("@/lib/backend-client", () => ({ hasBackendPermission: (permission: string) => access.all || access.backend.has(permission) }))
import { AppSidebar } from "./app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
beforeEach(() => {
  access.pathname = "/"; access.all = true; access.loading = false
  access.client = new Set(); access.backend = new Set()
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
function renderSidebar() { return render(<SidebarProvider><AppSidebar /></SidebarProvider>) }

it("uses direct section links and removes submenus duplicated by page tabs", () => {
  renderSidebar()
  for (const [name, href] of [["Clinical Guidelines", "/guidelines"], ["Drug Index", "/drugs"], ["Decision Tools", "/decision-tools"], ["User Management", "/users"], ["Health Facilities", "/health-facilities"], ["Support", "/support"], ["Settings", "/settings"]]) {
    expect(screen.getByRole("link", { name })).toHaveAttribute("href", href)
    expect(screen.queryByRole("button", { name })).not.toBeInTheDocument()
  }
  for (const name of ["Account Analytics", "All Guidelines", "Create Guideline", "All Drugs", "All Tools", "Calculators", "Clinical Review", "Roles & Permissions", "Regions", "Add Facility", "Documentation", "FAQs", "Notifications", "Firebase"]) expect(screen.queryByRole("link", { name })).not.toBeInTheDocument()
})

it.each([
  ["/", "Dashboard"],
  ["/analytics/accounts", "Dashboard"],
  ["/guidelines/document-1/versions/version-1/review", "Clinical Guidelines"],
  ["/drugs/categories/category-1/edit", "Drug Index"],
  ["/decision-tools/tool-1/author", "Decision Tools"],
  ["/users/roles/role-1/permissions", "User Management"],
  ["/health-facilities/districts", "Health Facilities"],
  ["/support/faqs/tags/tag-1/edit", "Support"],
  ["/settings/firebase", "Settings"],
  ["/diseases/disease-1", "Diseases"],
  ["/content-hubs/hub-1", "Content Hubs"],
])("highlights the parent section when opening %s directly", (pathname, name) => {
  access.pathname = pathname
  renderSidebar()
  const link = screen.getByRole("link", { name })
  expect(link).toHaveAttribute("aria-current", "page")
  expect(link).toHaveAttribute("data-active", "true")
  if (name !== "Dashboard") expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("data-active", "false")
})

it("matches route boundaries without activating a similarly named section", () => {
  access.pathname = "/users-other"
  const { container } = renderSidebar()
  expect(container.querySelectorAll('[data-sidebar="menu-button"][data-active="true"]')).toHaveLength(0)
})

it("retains and opens the untabbed Outbreak submenu with the most specific route active", () => {
  access.pathname = "/outbreaks/resources/resource-1"
  renderSidebar()
  expect(screen.getByRole("button", { name: "Outbreak Management" })).toHaveAttribute("aria-expanded", "true")
  expect(screen.getByRole("link", { name: "Outbreak Resources" })).toHaveAttribute("aria-current", "page")
  expect(screen.getByRole("link", { name: "Outbreaks" })).not.toHaveAttribute("aria-current")
  expect(screen.getByRole("link", { name: "Situation Reports" })).toBeInTheDocument()
})

it("retains only the permitted Outbreak destinations", () => {
  access.all = false; access.pathname = "/situation-reports/report-1"
  access.backend = new Set(["situation_report.read"])
  renderSidebar()
  expect(screen.getByRole("link", { name: "Situation Reports" })).toHaveAttribute("aria-current", "page")
  expect(screen.queryByRole("link", { name: "Outbreaks" })).not.toBeInTheDocument()
  expect(screen.queryByRole("link", { name: "Outbreak Resources" })).not.toBeInTheDocument()
})

it("keeps Diseases and Content Hubs accessible with their existing permission requirements", () => {
  access.all = false
  access.client = new Set(["content:read:any"])
  access.backend = new Set(["disease.taxonomy.read"])
  renderSidebar()
  expect(screen.getByRole("link", { name: "Diseases" })).toHaveAttribute("href", "/diseases")
  expect(screen.queryByRole("link", { name: "Content Hubs" })).not.toBeInTheDocument()
})

it("preserves the content-read requirement for the promoted guideline destinations", () => {
  access.all = false
  access.backend = new Set(["disease.taxonomy.read", "content_hub.manage"])
  renderSidebar()
  expect(screen.queryByRole("link", { name: "Diseases" })).not.toBeInTheDocument()
  expect(screen.queryByRole("link", { name: "Content Hubs" })).not.toBeInTheDocument()
  expect(screen.queryByRole("link", { name: "Clinical Guidelines" })).not.toBeInTheDocument()
})

it.each(["notification.analytics.read", "firebase.config.manage", "firebase.push.test"])("keeps Settings reachable with %s access", permission => {
  access.all = false; access.backend = new Set([permission])
  renderSidebar()
  expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute("href", "/settings")
  expect(screen.queryByRole("link", { name: "User Management" })).not.toBeInTheDocument()
})

it("waits for permission loading before showing protected menu items", () => {
  access.loading = true
  renderSidebar()
  expect(screen.queryByRole("link", { name: "Clinical Guidelines" })).not.toBeInTheDocument()
  expect(screen.queryByRole("button", { name: "Outbreak Management" })).not.toBeInTheDocument()
  expect(screen.getByRole("link", { name: /MediGuide\s*Dashboard/ })).toBeInTheDocument()
})
