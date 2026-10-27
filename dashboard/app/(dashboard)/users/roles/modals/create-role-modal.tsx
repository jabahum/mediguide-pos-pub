"use client"

import * as React from "react"
import { useForm, useWatch } from "react-hook-form"
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
import { CreateRoleFormData, createRoleSchema, generateRoleKey } from "../types"

interface CreateRoleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateRoleFormData & { key: string }) => Promise<void>
  loading?: boolean
}

export function CreateRoleModal({
  open,
  onOpenChange,
  onSubmit,
  loading = false
}: CreateRoleModalProps) {
  const form = useForm<CreateRoleFormData>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: {
      name: "",
      description: "",
      isActive: true,
    },
  })

  const name = useWatch({ control: form.control, name: "name" })
  const [submitError, setSubmitError] = React.useState("")

  const handleSubmit = async (data: CreateRoleFormData) => {
    setSubmitError("")
    try {
      // Generate key from name before submitting
      const roleData = {
        ...data,
        key: generateRoleKey(data.name)
      }
      await onSubmit(roleData)
      form.reset()
      onOpenChange(false)
    } catch (error) {
      // Error handling is done in the parent component
      setSubmitError(error instanceof Error ? error.message : "Could not create the role")
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-2xl sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Create New Role</span>
          </DialogTitle>
          <DialogDescription>
            Add a new role to the system. The role key will be automatically generated from the name.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Role Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Content Reviewer, System Administrator"
                      disabled={loading}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Display name for the role (will auto-generate unique identifier)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-xl border bg-muted/20 p-3 text-xs"><p className="font-medium text-muted-foreground">Generated role key</p><code className="mt-1 block break-all">{generateRoleKey(name) || "Enter a role name"}</code></div>

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
                Create Role
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}