import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, expect, it, vi } from "vitest"
import type { SupportTicketsWithExpanded } from "@/types/expanded"
import type { RowAction } from "@/types/data-table"
const mocks = vi.hoisted(() => ({ invalidate: vi.fn(), push: vi.fn(), replace: vi.fn() }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push, replace: mocks.replace }) }))
vi.mock("@tanstack/react-query", () => ({ useQueryClient: () => ({ invalidateQueries: mocks.invalidate }) }))
vi.mock("@/lib/permission-context", () => ({ usePermissionContext: () => ({ loading: false, hasPermission: () => true }) }))
vi.mock("@/components/ui/backend-data-table", () => ({ BackendDataTable: ({ rowActions }: { rowActions: RowAction<SupportTicketsWithExpanded>[] }) => <div>{rowActions.filter(action => ["reply", "status", "assign"].includes(action.id)).map(action => <button key={action.id} onClick={() => action.onClick?.({ id: "ticket-1", subject: "Help", status: "open", priority: "normal" } as SupportTicketsWithExpanded)}>Open {action.id}</button>)}</div> }))
vi.mock("@/components/dialogs/ticket-reply-dialog", () => ({ TicketReplyDialog: ({ open, onOpenChange, onReplyAdded }: { open: boolean; onOpenChange: (open: boolean) => void; onReplyAdded: () => void }) => open ? <div><button onClick={() => { onOpenChange(false); onReplyAdded() }}>Save reply</button><button onClick={() => onOpenChange(false)}>Cancel reply</button></div> : null }))
vi.mock("@/components/dialogs/ticket-status-update-dialog", () => ({ TicketStatusUpdateDialog: ({ open, onOpenChange, onStatusUpdated }: { open: boolean; onOpenChange: (open: boolean) => void; onStatusUpdated: () => void }) => open ? <button onClick={() => { onOpenChange(false); onStatusUpdated() }}>Save status</button> : null }))
vi.mock("@/components/dialogs/ticket-assign-dialog", () => ({ TicketAssignDialog: ({ open, onOpenChange, onTicketAssigned }: { open: boolean; onOpenChange: (open: boolean) => void; onTicketAssigned: () => void }) => open ? <button onClick={() => { onOpenChange(false); onTicketAssigned() }}>Save assign</button> : null }))
import SupportPage from "./page"
afterEach(() => { cleanup(); vi.clearAllMocks() })
it.each(["reply", "status", "assign"])("refreshes the inbox after a successful %s", async action => {
  render(<SupportPage />)
  await userEvent.click(screen.getByRole("button", { name: `Open ${action}` }))
  await userEvent.click(screen.getByRole("button", { name: `Save ${action}` }))
  await waitFor(() => expect(mocks.invalidate).toHaveBeenCalledWith({ queryKey: ["backend", "support_tickets"] }))
})
it("does not treat a cancelled dialog as an updated ticket", async () => {
  render(<SupportPage />)
  await userEvent.click(screen.getByRole("button", { name: "Open reply" }))
  await userEvent.click(screen.getByRole("button", { name: "Cancel reply" }))
  expect(mocks.invalidate).not.toHaveBeenCalled()
})
