"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useState, useCallback, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePermissionContext } from "@/lib/permission-context"

import { SupportSectionHeader } from "@/components/support/support-section"
import { BackendDataTable } from "@/components/ui/backend-data-table"
import { TicketReplyDialog } from "@/components/dialogs/ticket-reply-dialog"
import { TicketStatusUpdateDialog } from "@/components/dialogs/ticket-status-update-dialog"
import { TicketAssignDialog } from "@/components/dialogs/ticket-assign-dialog"

import { columns } from "./columns"
import { createSupportTicketRowActions, supportTicketBulkActions } from "./ticket-actions"
import { supportTicketsAvailableFields } from "./fields"
import type { SupportTicketsWithExpanded } from "@/types/expanded"
import { SupportTicketsService } from "@/services/support-tickets.service"

export default function SupportPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { hasPermission, loading } = usePermissionContext()
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketsWithExpanded | null>(null)

  useEffect(() => {
    if (loading) return
    if (!hasPermission("content", "read:any")) {
      router.replace("/")
    }
  }, [loading, hasPermission, router])
  const [replyDialogOpen, setReplyDialogOpen] = useState(false)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)

  // Handle dialog actions
  const handleAddReply = useCallback((ticket: SupportTicketsWithExpanded) => {
    setSelectedTicket(ticket)
    setReplyDialogOpen(true)
  }, [])

  const handleUpdateStatus = useCallback((ticket: SupportTicketsWithExpanded) => {
    setSelectedTicket(ticket)
    setStatusDialogOpen(true)
  }, [])

  const handleAssignTicket = useCallback((ticket: SupportTicketsWithExpanded) => {
    setSelectedTicket(ticket)
    setAssignDialogOpen(true)
  }, [])

  // Handle dialog completions (refresh data)
  const handleDialogClose = useCallback(() => {
    setSelectedTicket(null)

  }, [])


  const handleTicketChanged = useCallback(() => {
    setSelectedTicket(null)
    void queryClient.invalidateQueries({ queryKey: ["backend", "support_tickets"] })
  }, [queryClient])

  // Create row actions with handlers
  const rowActions = useMemo(() => 
    createSupportTicketRowActions(
      (path) => router.push(path),
      handleAddReply,
      handleUpdateStatus,
      handleAssignTicket,
    ), 
    [router, handleAddReply, handleUpdateStatus, handleAssignTicket]
  )


  return (
    <div className="w-full min-w-0 space-y-6">
      {/* Page Header */}
      <SupportSectionHeader section="tickets"
        title="Support Tickets"
        description="Manage and respond to support tickets from mobile app users"
      />

      {/* Simplified DataTable */}
      <BackendDataTable<SupportTicketsWithExpanded>
        collection="support_tickets"
        loadPage={({ page, perPage, search }) => SupportTicketsService.getTickets({ page, per_page: perPage, search })}
        columns={columns}
        searchPlaceholder="Search ticket subject or description…"
        searchFields={["subject", "description"]}
        rowActions={rowActions}
        bulkActions={supportTicketBulkActions}
        availableFields={supportTicketsAvailableFields}
        ui={{
          appearance: "workspace",
          title: "Ticket inbox",
          searchLabel: "Search tickets",
          exportable: true
        }}
      />

      {/* Dialogs */}
      <TicketReplyDialog
        ticket={selectedTicket}
        open={replyDialogOpen}
        onOpenChange={(open) => {
          setReplyDialogOpen(open)
          if (!open) handleDialogClose()
        }}
        onReplyAdded={handleTicketChanged}
      />

      <TicketStatusUpdateDialog
        ticket={selectedTicket}
        open={statusDialogOpen}
        onOpenChange={(open) => {
          setStatusDialogOpen(open)
          if (!open) handleDialogClose()
        }}
        onStatusUpdated={handleTicketChanged}
      />

      <TicketAssignDialog
        ticket={selectedTicket}
        open={assignDialogOpen}
        onOpenChange={(open) => {
          setAssignDialogOpen(open)
          if (!open) handleDialogClose()
        }}
        onTicketAssigned={handleTicketChanged}
      />
    </div>
  )
}
