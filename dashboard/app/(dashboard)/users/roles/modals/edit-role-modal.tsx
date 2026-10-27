"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Shield } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Role, EditRoleFormData, editRoleSchema } from "../types"

interface EditRoleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: Role | null
  onSubmit: (id: string, data: EditRoleFormData) => Promise<void>
  loading?: boolean
}

export function EditRoleModal({
  open,
  onOpenChange,
  role,
  onSubmit,
  loading = false
}: EditRoleModalProps) {
  const form = useForm<EditRoleFormData>({
    resolver: zodResolver(editRoleSchema),
    defaultValues: {
      description: "",
      isActive: true,
    },
  })

  // Reset form when role changes
  React.useEffect(() => {
    if (role) {
      form.reset({
        description: role.description || "",
        isActive: role.isActive ?? true,
      })
    }
  }, [role, form])

  const [submitError, setSubmitError] = React.useState("")

  const handleSubmit = async (data: EditRoleFormData) => {
    if (!role) return
    setSubmitError("")
    try {
      await onSubmit(role.id, data)
      onOpenChange(false)
    } catch (error) {
      // Error handling is done in the parent component
      setSubmitError(error instanceof Error ? error.message : "Could not update the role")
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      onOpenChange(newOpen)
      if (!newOpen) {
        form.reset()
        setSubmitError("")
      }
    }
  }

  if (!role) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-2xl sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Edit Role</span>
          </DialogTitle>
          <DialogDescription>
            Update the role information. Role name and key cannot be changed.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Role Name (Read-only) */}
            <div className="space-y-2">
              <label htmlFor="role-display-name" className="text-sm font-medium">Role Name</label>
              <Input
                id="role-display-name"
                value={role.name}
                disabled
                className="bg-muted"
              />
              <FormDescription>
                Role name cannot be changed for system consistency
              </FormDescription>
            </div>

            <div className="rounded-xl border bg-muted/20 p-3 text-xs"><p className="font-medium text-muted-foreground">Role key</p><code className="mt-1 block break-all">{role.key}</code></div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the role responsibilities and permissions..."
                      rows={3}
                      disabled={loading}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Explain what this role can do and its responsibilities
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Active Status */}
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-xl border bg-muted/20 p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Active Role</FormLabel>
                    <FormDescription>
                      Active roles can be assigned to users
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={loading}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {submitError && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{submitError}</p>}

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Role
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}