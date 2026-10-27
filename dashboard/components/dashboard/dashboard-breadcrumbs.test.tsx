import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { dashboardBreadcrumbs } from "@/lib/dashboard-breadcrumbs";
import { DashboardBreadcrumbs } from "./dashboard-breadcrumbs";

const location = vi.hoisted(() => ({ pathname: "/", outbreakAccess: true }));
vi.mock("next/navigation", () => ({ usePathname: () => location.pathname }));
vi.mock("@/lib/backend-client", () => ({ hasBackendPermission: () => location.outbreakAccess }));
afterEach(() => { cleanup(); location.outbreakAccess = true; });

it.each([
  ["/", "Overview"], ["/guidelines", "Clinical Guidelines"], ["/diseases", "Diseases & Conditions"],
  ["/content-hubs", "Content Hubs"], ["/drugs", "Drug Index"], ["/outbreaks", "Outbreak Management"],
  ["/decision-tools", "Decision Tools"], ["/users", "User Management"], ["/health-facilities", "Health Facilities"],
  ["/support", "Support"], ["/settings", "Settings"], ["/analytics/accounts", "Account Analytics"],
])("shows the correct current page for %s", (pathname, label) => {
  location.pathname = pathname;
  render(<DashboardBreadcrumbs />);
  const breadcrumb = within(screen.getByRole("navigation", { name: "Dashboard breadcrumb" }));
  expect(breadcrumb.getByRole("link", { name: label })).toHaveAttribute("aria-current", "page");
  expect(breadcrumb.getByRole("link", { name: "MediGuide Dashboard" })).toHaveAttribute("href", "/");
});

it("updates the breadcrumb after sidebar navigation and links to the parent section", () => {
  location.pathname = "/guidelines/categories";
  const view = render(<DashboardBreadcrumbs />);
  expect(screen.getByRole("link", { name: "Clinical Guidelines" })).toHaveAttribute("href", "/guidelines");
  expect(screen.getByRole("link", { name: "Categories" })).toHaveAttribute("aria-current", "page");
  location.pathname = "/settings/firebase";
  view.rerender(<DashboardBreadcrumbs />);
  expect(screen.queryByText("Categories")).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute("href", "/settings");
  expect(screen.getByRole("link", { name: "Firebase" })).toHaveAttribute("aria-current", "page");
});

it.each([
  ["/guidelines/doc-123/versions/version-456/review", ["Clinical Guidelines", "Guideline details", "Editorial review"], ["/guidelines", "/guidelines/doc-123", "/guidelines/doc-123/versions/version-456/review"]],
  ["/users/roles/role-123/permissions", ["User Management", "Roles & permissions", "Role permissions"], ["/users", "/users/roles", "/users/roles/role-123/permissions"]],
  ["/support/faqs/tags/tag-123/edit", ["Support", "FAQs", "FAQ tags", "Edit FAQ tag"], ["/support", "/support/faqs", "/support/faqs/tags", "/support/faqs/tags/tag-123/edit"]],
  ["/admin/health-facilities/facility-123/edit", ["Health Facilities", "Facility details", "Edit facility"], ["/health-facilities", "/health-facilities/facility-123", "/health-facilities/facility-123/edit"]],
])("uses readable record labels and only valid parent pages for %s", (path, labels, hrefs) => {
  const crumbs = dashboardBreadcrumbs(path);
  expect(crumbs.map(item => item.label)).toEqual(labels);
  expect(crumbs.map(item => item.href)).toEqual(hrefs);
});

it("keeps report-only readers on an accessible outbreak landing page", () => {
  location.pathname = "/situation-reports/report-123";
  location.outbreakAccess = false;
  render(<DashboardBreadcrumbs />);
  expect(screen.getByRole("link", { name: "Outbreak Management" })).toHaveAttribute("href", "/situation-reports");
  expect(screen.getByRole("link", { name: "Report details" })).toHaveAttribute("aria-current", "page");
});
