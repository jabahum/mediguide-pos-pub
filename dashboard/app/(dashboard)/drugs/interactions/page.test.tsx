import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname: () => "/drugs/interactions", useRouter: () => router }));
vi.mock("@/lib/permission-context", () => ({ usePermissionContext: () => ({ loading: false, hasPermission: () => true }) }));
import DrugInteractionsPage from "./page";
import { interactionCsv, interactionExamples } from "./interaction-examples";
afterEach(cleanup);

test("labels demonstration content and filters by drug name and severity", () => {
  render(<DrugInteractionsPage />);
  expect(screen.getByText("Example data")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Interactions" })).toHaveAttribute("aria-current", "page");
  fireEvent.change(screen.getByLabelText("Search interactions"), { target: { value: " insulin " } });
  expect(screen.getByRole("heading", { name: "Insulin + Beta-blockers" })).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Warfarin + Aspirin" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /^3 Major$/ }));
  expect(screen.getByText("No matching interaction examples")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Export examples" })).toBeDisabled();
  fireEvent.click(screen.getAllByRole("button", { name: "Clear filters" })[0]);
  expect(screen.getByRole("heading", { name: "Warfarin + Aspirin" })).toBeInTheDocument();
});

test("CSV retains the example label, filtered rows, and escaped content", () => {
  const csv = interactionCsv([{ ...interactionExamples[0], drug1: 'Example "A", medicine' }]);
  expect(csv).toContain('"Dataset","Drug 1","Drug 2"');
  expect(csv).toContain('"Example data","Example ""A"", medicine"');
  expect(csv.split("\r\n")).toHaveLength(2);
  expect(csv).not.toContain("Digoxin");
});
