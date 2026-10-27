import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useState } from "react";
import { CreateRouteDialog } from "./create-route-dialog";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

const navigation = vi.hoisted(() => ({ back: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navigation }));
beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

it("shows the existing form in an accessible dialog and leaves validation and submission to it", () => {
  const submit = vi.fn(event => event.preventDefault());
  render(<CreateRouteDialog title="New content hub"><form onSubmit={submit}><label htmlFor="hub-name">Hub name</label><input id="hub-name" name="name" required /><button type="submit">Save hub</button></form></CreateRouteDialog>);
  const dialog = within(screen.getByRole("dialog", { name: "New content hub" }));
  fireEvent.change(dialog.getByRole("textbox", { name: "Hub name" }), { target: { value: "Cholera care" } });
  fireEvent.click(dialog.getByRole("button", { name: "Save hub" }));
  expect(submit).toHaveBeenCalledOnce();
  expect(navigation.back).not.toHaveBeenCalled();
  expect(dialog.getByRole("textbox")).toHaveValue("Cholera care");
});

it("returns through router history when closed so the background page retains its state", () => {
  render(<CreateRouteDialog title="Create user"><input aria-label="Name" /></CreateRouteDialog>);
  fireEvent.click(screen.getByRole("button", { name: "Close" }));
  expect(navigation.back).toHaveBeenCalledOnce();
});

it("supports dismissal with Escape", async () => {
  render(<CreateRouteDialog title="Add drug"><input aria-label="Drug name" /></CreateRouteDialog>);
  fireEvent.keyDown(screen.getByRole("textbox"), { key: "Escape" });
  await waitFor(() => expect(navigation.back).toHaveBeenCalledOnce());
});

function NestedCreateForm() {
  const [open, setOpen] = useState(false);
  return <><button onClick={() => setOpen(true)}>Add location</button><Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogTitle>New location</DialogTitle><DialogDescription>Enter a facility location.</DialogDescription><input aria-label="Location name" /></DialogContent></Dialog></>;
}

it("allows existing nested creation dialogs to close without dismissing the parent form", async () => {
  render(<CreateRouteDialog title="Add health facility"><NestedCreateForm /></CreateRouteDialog>);
  fireEvent.click(screen.getByRole("button", { name: "Add location" }));
  const nested = within(screen.getByRole("dialog", { name: "New location" }));
  fireEvent.click(nested.getByRole("button", { name: "Close" }));
  await waitFor(() => expect(screen.queryByRole("dialog", { name: "New location" })).not.toBeInTheDocument());
  expect(screen.getByRole("dialog", { name: "Add health facility" })).toBeInTheDocument();
  expect(navigation.back).not.toHaveBeenCalled();
});
