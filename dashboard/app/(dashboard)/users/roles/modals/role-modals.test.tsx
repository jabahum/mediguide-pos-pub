import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, expect, it, vi } from "vitest"
import { CreateRoleModal } from "./create-role-modal"
import { EditRoleModal } from "./edit-role-modal"
import type { Role } from "../types"
beforeEach(() => vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} }))
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

it("previews the role key and preserves entered values after a failed create", async () => {
  const submit = vi.fn().mockRejectedValue(new Error("Role name is already in use"))
  const close = vi.fn()
  render(<CreateRoleModal open onOpenChange={close} onSubmit={submit} />)
  await userEvent.type(screen.getByRole("textbox", { name: "Role Name" }), "Clinical Reviewer")
  expect(screen.getByText("clinical_reviewer")).toBeInTheDocument()
  await userEvent.click(screen.getByRole("button", { name: "Create Role" }))
  expect(await screen.findByRole("alert")).toHaveTextContent("Role name is already in use")
  expect(screen.getByRole("textbox", { name: "Role Name" })).toHaveValue("Clinical Reviewer")
  expect(close).not.toHaveBeenCalled()
})
it("submits the generated role key and closes after success", async () => {
  const submit = vi.fn().mockResolvedValue(undefined)
  const close = vi.fn()
  render(<CreateRoleModal open onOpenChange={close} onSubmit={submit} />)
  await userEvent.type(screen.getByRole("textbox", { name: "Role Name" }), "Clinical Reviewer")
  await userEvent.click(screen.getByRole("button", { name: "Create Role" }))
  await waitFor(() => expect(submit).toHaveBeenCalledWith(expect.objectContaining({ name: "Clinical Reviewer", key: "clinical_reviewer", isActive: true })))
  expect(close).toHaveBeenCalledWith(false)
})
it("keeps an edit open with its original identifier and entered description on failure", async () => {
  const close = vi.fn()
  render(<EditRoleModal open onOpenChange={close} onSubmit={vi.fn().mockRejectedValue(new Error("Save unavailable"))} role={{ id: "role-1", name: "Reviewer", key: "reviewer", description: "", isActive: true } as Role} />)
  expect(screen.getByRole("textbox", { name: "Role Name" })).toBeDisabled()
  expect(screen.getByText("reviewer")).toBeInTheDocument()
  await userEvent.type(screen.getByRole("textbox", { name: "Description (Optional)" }), "Reviews clinical content")
  await userEvent.click(screen.getByRole("button", { name: "Update Role" }))
  expect(await screen.findByRole("alert")).toHaveTextContent("Save unavailable")
  expect(screen.getByRole("textbox", { name: "Description (Optional)" })).toHaveValue("Reviews clinical content")
  expect(close).not.toHaveBeenCalled()
})
