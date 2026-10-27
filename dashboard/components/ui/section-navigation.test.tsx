import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { CreateFormContext } from "@/components/dialogs/create-dialog-context";
import { GuidelineSectionHeader } from "@/components/guidelines/guideline-section";
import { DrugSectionHeader } from "@/components/drugs/drug-section";
import { ToolSectionHeader } from "@/components/clinical-tools/tool-section";
import { UserSectionHeader } from "@/components/users/user-section";
import { FacilitySectionHeader } from "@/components/facilities/facility-section";
import { SupportSectionHeader } from "@/components/support/support-section";

vi.mock("next/navigation", () => ({ usePathname: () => "/guidelines" }));
vi.mock("@/lib/permission-context", () => ({ usePermissionContext: () => ({ hasPermission: () => true }) }));
vi.mock("@/lib/backend-client", () => ({ hasBackendPermission: () => true }));
afterEach(cleanup);
const headers = [
  ["guidelines", GuidelineSectionHeader, "Clinical guideline sections"],
  ["drugs", DrugSectionHeader, "Drug index sections"],
  ["tools", ToolSectionHeader, "Decision tool sections"],
  ["users", UserSectionHeader, "User management sections"],
  ["facilities", FacilitySectionHeader, "Health facility sections"],
  ["support", SupportSectionHeader, "Support sections"],
] as const;

it.each(headers)("keeps %s library navigation but hides it in a creation dialog", (_name, Header, navigation) => {
  const view = render(<Header title="Record form" />);
  expect(screen.getByRole("navigation", { name: navigation })).toBeInTheDocument();
  view.rerender(<CreateFormContext.Provider value={{ query: "", background: "/guidelines", parent: "/guidelines", close: vi.fn() }}><Header title="Record form" /></CreateFormContext.Provider>);
  expect(screen.queryByRole("navigation", { name: navigation })).not.toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Record form" })).toBeInTheDocument();
});

it.each(headers)("allows standalone %s edit forms to omit section tabs", (_name, Header, navigation) => {
  render(<Header title="Edit record" showNavigation={false} />);
  expect(screen.queryByRole("navigation", { name: navigation })).not.toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Edit record" })).toBeInTheDocument();
});
