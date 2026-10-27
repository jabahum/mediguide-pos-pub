"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { LoadingState } from "@/components/ui/loading-state"
import { UserSelector } from "@/components/ui/user-selector"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import { SupportTicketsService } from "@/services/support-tickets.service"
import type { SupportTicketsWithExpanded } from "@/types/expanded"
import { showToast } from "@/lib/toast"

const assignSchema = z.object({
  assigned_to: z.string().optional(),
})

type AssignFormData = z.infer<typeof assignSchema>

interface TicketAssignDialogProps {
  ticket: SupportTicketsWithExpanded | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onTicketAssigned?: () => void
}

export function TicketAssignDialog({
  ticket,
  open,
  onOpenChange,
  onTicketAssigned,
}: TicketAssignDialogProps) {
  const [loading, setLoading] = useState(false)

  const form = useForm<AssignFormData>({
    resolver: zodResolver(assignSchema),
  })

  // Set current assignment when ticket changes
  useEffect(() => {
    if (ticket && open) {
      form.reset({
        assigned_to: ticket.assigned_to || "",
      })
    }
  }, [ticket, open, form])

  const onSubmit = async (data: AssignFormData) => {
    if (!ticket) return

    try {
      setLoading(true)

      // Check if assignment actually changed
      const currentAssignment = ticket.assigned_to || ""
      const newAssignment = data.assigned_to || ""

      if (currentAssignment === newAssignment) {
        showToast.info("Info", "No changes to update")
        onOpenChange(false)
        return
      }

      if (newAssignment) {
        await SupportTicketsService.assignTicket(ticket.id, newAssignment)
        showToast.success("Success", "Ticket assigned successfully")
      } else {
        // Unassign ticket by updating with empty assigned_to
        await SupportTicketsService.updateTicket(ticket.id, { assigned_to: undefined })
        showToast.success("Success", "Ticket unassigned")
      }

      onOpenChange(false)
      onTicketAssigned?.()
    } catch (error) {
      console.error('Error assigning ticket:', error)
      showToast.error("Error", "Failed to assign ticket")
    } finally {
      setLoading(false)
    }
  }

  if (!ticket) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-2xl sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Assign Ticket</DialogTitle>
          <DialogDescription>
            Assign this ticket to a team member for handling.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="assigned_to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign to</FormLabel>
                  <FormControl>
                    <UserSelector
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select a user"
                      showUnassignedOption={true}
                      allowClear={true}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

              {/* Show current assignment */}
              {ticket.expand?.assigned_to && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Currently assigned to:</p>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={ticket.expand.assigned_to.avatar} />
                      <AvatarFallback>
                        {ticket.expand.assigned_to.name?.charAt(0) || 'A'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {ticket.expand.assigned_to.name || ticket.expand.assigned_to.email}
                      </p>
                      {ticket.expand.assigned_to.name && (
                        <p className="text-xs text-muted-foreground">
                          {ticket.expand.assigned_to.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <LoadingState size="sm" message="Assigning..." />
                  ) : (
                    "Assign Ticket"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
      </DialogContent>
    </Dialog>
  )
}