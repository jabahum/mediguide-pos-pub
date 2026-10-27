import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, expect, it, vi } from "vitest"
import { AdminEntityModal, type AdminFieldDef } from "./admin-entity-modal"
import { facilityOptionsQueryKey } from "@/lib/facility-query-keys"
vi.mock("@/lib/toast", () => ({ showToast: { success: vi.fn(), error: vi.fn() } }))
const fields: AdminFieldDef[] = [{ name: "name", label: "Name", type: "text" }, { name: "code", label: "Code", type: "text", required: false }]
afterEach(cleanup)
function setup(create = vi.fn().mockResolvedValue({ id: "region-1" }), record?: Record<string, unknown>) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const invalidate = vi.spyOn(client, "invalidateQueries")
  const update = vi.fn().mockResolvedValue({ id: "region-1" })
  const close = vi.fn()
  render(<QueryClientProvider client={client}><AdminEntityModal open collection="regions" onClose={close} entityLabel="Region" fields={fields} createRecord={create} updateRecord={update} record={record} /></QueryClientProvider>)
  return { create, update, close, invalidate }
}
it("validates required fields before creating a reference record", async () => {
  const { create } = setup()
  await userEvent.click(screen.getByRole("button", { name: "Create Region" }))
  expect(await screen.findByText("Name is required")).toBeInTheDocument()
  expect(create).not.toHaveBeenCalled()
})
it("refreshes the matching reference table and open facility pickers after create", async () => {
  const { create, close, invalidate } = setup()
  await userEvent.type(screen.getByRole("textbox", { name: "Name *" }), "Central")
  await userEvent.click(screen.getByRole("button", { name: "Create Region" }))
  await waitFor(() => expect(create).toHaveBeenCalledWith({ name: "Central", code: "" }))
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ["backend", "regions"] })
  expect(invalidate).toHaveBeenCalledWith({ queryKey: facilityOptionsQueryKey })
  expect(close).toHaveBeenCalled()
})
it("updates the selected record while retaining its identifier", async () => {
  const { update, create } = setup(undefined, { id: "region-1", name: "Old name", code: "R1" })
  await userEvent.clear(screen.getByRole("textbox", { name: "Name *" }))
  await userEvent.type(screen.getByRole("textbox", { name: "Name *" }), "New name")
  await userEvent.click(screen.getByRole("button", { name: "Save Changes" }))
  await waitFor(() => expect(update).toHaveBeenCalledWith("region-1", { name: "New name", code: "R1" }))
  expect(create).not.toHaveBeenCalled()
})
it("keeps entered values and the dialog open after a failed save", async () => {
  const { close, invalidate } = setup(vi.fn().mockRejectedValue(new Error("Save unavailable")))
  await userEvent.type(screen.getByRole("textbox", { name: "Name *" }), "Central")
  await userEvent.click(screen.getByRole("button", { name: "Create Region" }))
  expect(await screen.findByRole("alert")).toHaveTextContent("Save unavailable")
  expect(screen.getByRole("textbox", { name: "Name *" })).toHaveValue("Central")
  expect(close).not.toHaveBeenCalled()
  expect(invalidate).not.toHaveBeenCalled()
})
it("prevents closing or editing while a reference save is in progress", async () => {
  let finish!: (result: unknown) => void
  const { close } = setup(vi.fn(() => new Promise(resolve => { finish = resolve })))
  await userEvent.type(screen.getByRole("textbox", { name: "Name *" }), "Central")
  await userEvent.click(screen.getByRole("button", { name: "Create Region" }))
  expect(screen.getByRole("textbox", { name: "Name *" })).toBeDisabled()
  await userEvent.keyboard("{Escape}")
  expect(close).not.toHaveBeenCalled()
  await act(async () => finish({ id: "region-1" }))
  await waitFor(() => expect(close).toHaveBeenCalled())
})
