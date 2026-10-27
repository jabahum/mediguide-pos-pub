import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CreateDialogProvider } from "./create-dialog-provider";
import { DashboardLink, useCreateSearchParams, useDashboardRouter } from "./create-dialog-context";

const navigation = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), pathname: "/content-hubs" }));
vi.mock("next/navigation", () => ({ useRouter: () => navigation, usePathname: () => navigation.pathname, useSearchParams: () => new URLSearchParams("background=retained") }));
vi.mock("@/app/(dashboard)/content-hubs/new/create-form", () => ({ default: function HubForm() {
  const router = useDashboardRouter();
  return <><input aria-label="Hub name" /><button onClick={() => router.push("/content-hubs")}>Cancel form</button><button onClick={() => router.replace("/content-hubs/hub-1")}>Save hub</button></>;
} }));
vi.mock("@/app/(dashboard)/decision-tools/create/create-form", () => ({ default: function ToolForm() {
  const router = useDashboardRouter();
  const query = useCreateSearchParams();
  const [name, setName] = useState("");
  return <><p>Tool type: {query.get("type")}</p><p>Duplicate: {query.get("duplicate")}</p><input aria-label="Tool name" value={name} onChange={event => setName(event.target.value)} /><button onClick={() => router.replace("/decision-tools/create?type=assessment&duplicate=tool-1")}>Next step</button><button onClick={() => router.push("/decision-tools")}>Finish</button></>;
} }));
vi.mock("@/app/(dashboard)/generic-pages/[pageKey]/content/create/create-form", () => ({ default: function ContentForm({ pageKey }: { pageKey: string }) {
  const query = useCreateSearchParams();
  return <p>Content for {pageKey}, return to {query.get("returnTo")}</p>;
} }));

beforeEach(() => { vi.clearAllMocks(); navigation.pathname = "/content-hubs"; });
afterEach(cleanup);
function Launchers() {
  const router = useDashboardRouter();
  return <><input aria-label="Library search" defaultValue="cholera" /><DashboardLink href="/content-hubs/new">New hub</DashboardLink><button onClick={() => router.push("/decision-tools/create?type=calculator&duplicate=tool-1")}>New tool</button><button onClick={() => router.push("/generic-pages/lab-test-menu/content/create?returnTo=/lab-test-menu")}>Add page content</button></>;
}
function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><CreateDialogProvider><Launchers /></CreateDialogProvider></QueryClientProvider>);
}

it("opens and closes the form without changing URL, calling the router, or resetting background state", async () => {
  setup();
  const initialUrl = window.location.href;
  fireEvent.click(screen.getByRole("button", { name: "New hub" }));
  await screen.findByRole("textbox", { name: "Hub name" });
  fireEvent.click(screen.getByRole("button", { name: "Close" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: "Library search" })).toHaveValue("cholera");
  expect(window.location.href).toBe(initialUrl);
  expect(navigation.push).not.toHaveBeenCalled();
  expect(navigation.replace).not.toHaveBeenCalled();
  expect(navigation.back).not.toHaveBeenCalled();
});

it("treats a form's cancel action as a local close", async () => {
  setup();
  fireEvent.click(screen.getByRole("button", { name: "New hub" }));
  fireEvent.click(await screen.findByRole("button", { name: "Cancel form" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(navigation.push).not.toHaveBeenCalled();
});

it("keeps preset and duplicate parameters local and preserves form data across creation steps", async () => {
  navigation.pathname = "/decision-tools";
  setup();
  fireEvent.click(screen.getByRole("button", { name: "New tool" }));
  expect(await screen.findByText("Tool type: calculator")).toBeInTheDocument();
  expect(screen.getByText("Duplicate: tool-1")).toBeInTheDocument();
  fireEvent.change(screen.getByRole("textbox", { name: "Tool name" }), { target: { value: "Risk assessment" } });
  fireEvent.click(screen.getByRole("button", { name: "Next step" }));
  expect(await screen.findByText("Tool type: assessment")).toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: "Tool name" })).toHaveValue("Risk assessment");
  fireEvent.click(screen.getByRole("button", { name: "Finish" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(navigation.replace).not.toHaveBeenCalled();
  expect(navigation.push).not.toHaveBeenCalled();
});

it("passes the selected page and return destination to a content form without routing", async () => {
  setup();
  fireEvent.click(screen.getByRole("button", { name: "Add page content" }));
  expect(await screen.findByText("Content for lab-test-menu, return to /lab-test-menu")).toBeInTheDocument();
  expect(navigation.push).not.toHaveBeenCalled();
});

it("retains navigation to the created record after a successful save", async () => {
  setup();
  fireEvent.click(screen.getByRole("button", { name: "New hub" }));
  fireEvent.click(await screen.findByRole("button", { name: "Save hub" }));
  await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith("/content-hubs/hub-1", undefined));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
