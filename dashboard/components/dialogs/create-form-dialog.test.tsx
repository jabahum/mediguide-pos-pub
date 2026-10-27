import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useState } from "react";
import { CreateFormDialog } from "./create-form-dialog";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

const navigation = vi.hoisted(() => ({ close: vi.fn() }));
beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

it("shows the existing form in an accessible dialog and leaves validation and submission to it", () => {
  const submit = vi.fn(event => event.preventDefault());
  render(<CreateFormDialog onClose={navigation.close} title="New content hub"><form onSubmit={submit}><label htmlFor="hub-name">Hub name</label><input id="hub-name" name="name" required /><button type="submit">Save hub</button></form></CreateFormDialog>);
  const dialog = within(screen.getByRole("dialog", { name: "New content hub" }));
  fireEvent.change(dialog.getByRole("textbox", { name: "Hub name" }), { target: { value: "Cholera care" } });
  fireEvent.click(dialog.getByRole("button", { name: "Save hub" }));
  expect(submit).toHaveBeenCalledOnce();
  expect(navigation.close).not.toHaveBeenCalled();
  expect(dialog.getByRole("textbox")).toHaveValue("Cholera care");
});

it("closes locally without relying on router history", () => {
  render(<CreateFormDialog onClose={navigation.close} title="Create user"><input aria-label="Name" /></CreateFormDialog>);
  fireEvent.click(screen.getByRole("button", { name: "Close" }));
  expect(navigation.close).toHaveBeenCalledOnce();
});

it("supports dismissal with Escape", async () => {
  render(<CreateFormDialog onClose={navigation.close} title="Add drug"><input aria-label="Drug name" /></CreateFormDialog>);
  fireEvent.keyDown(screen.getByRole("textbox"), { key: "Escape" });
  await waitFor(() => expect(navigation.close).toHaveBeenCalledOnce());
});

function NestedCreateForm() {
  const [open, setOpen] = useState(false);
  return <><button onClick={() => setOpen(true)}>Add location</button><Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogTitle>New location</DialogTitle><DialogDescription>Enter a facility location.</DialogDescription><input aria-label="Location name" /></DialogContent></Dialog></>;
}

it("allows existing nested creation dialogs to close without dismissing the parent form", async () => {
  render(<CreateFormDialog onClose={navigation.close} title="Add health facility"><NestedCreateForm /></CreateFormDialog>);
  fireEvent.click(screen.getByRole("button", { name: "Add location" }));
  const nested = within(screen.getByRole("dialog", { name: "New location" }));
  fireEvent.click(nested.getByRole("button", { name: "Close" }));
  await waitFor(() => expect(screen.queryByRole("dialog", { name: "New location" })).not.toBeInTheDocument());
  expect(screen.getByRole("dialog", { name: "Add health facility" })).toBeInTheDocument();
  expect(navigation.close).not.toHaveBeenCalled();
});
