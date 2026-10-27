"use client"

import React, { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { usePermissionContext } from "@/lib/permission-context"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { SupportSectionHeader, SupportFormActions } from "@/components/support/support-section"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { FaqTagsService } from "@/services/faq-tags.service"
import { showToast } from "@/lib/toast"
import type { FaqTagCreateData } from "@/types/faq"

// Available color options for tags
const TAG_COLOR_OPTIONS = [
  { value: "primary", label: "Primary", description: "Default blue theme color" },
  { value: "secondary", label: "Secondary", description: "Neutral gray color" },
  { value: "accent", label: "Accent", description: "Complementary theme color" },
  { value: "destructive", label: "Destructive", description: "Red warning color" },
  { value: "muted", label: "Muted", description: "Subtle gray color" },
  { value: "popover", label: "Popover", description: "Background variant" },
]

// Form validation schema
const tagFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be less than 50 characters"),
  description: z.string().max(200, "Description must be less than 200 characters").optional(),
  color: z.string().optional(),
  is_active: z.boolean().optional(),
})

type TagFormData = z.infer<typeof tagFormSchema>

export default function CreateTagPage() {
  const router = useRouter()
  const { hasPermission, loading } = usePermissionContext()
  const [isSubmitting, setIsSubmitting] = useState(false)

  React.useEffect(() => {
    if (loading) return
    if (!hasPermission("content", "create:any")) {
      router.replace("/support/faqs/tags")
    }
  }, [loading, hasPermission, router])

  const form = useForm<TagFormData>({
    resolver: zodResolver(tagFormSchema),
    defaultValues: {
      name: "",
      description: "",
      color: "primary",
      is_active: true,
    }
  })

  // Auto-generate slug from name
  const generateSlug = useCallback((name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Remove duplicate hyphens
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
  }, [])

  const onSubmit = useCallback(async (data: TagFormData) => {
    setIsSubmitting(true)
    
    try {
      const createData: FaqTagCreateData = {
        name: data.name,
        slug: generateSlug(data.name),
        description: data.description || "",
        color: data.color || "primary",
        is_active: data.is_active ?? true,
      }

      const result = await FaqTagsService.createTag(createData)
      
      if (result.success) {
        showToast.success("Success", result.message || "Tag created successfully")
        router.push('/support/faqs/tags')
      } else {
        showToast.error("Error", result.error || "Failed to create tag")
      }
    } catch (error: unknown) {
      console.error('Error creating tag:', error)
      showToast.error("Error", "Failed to create tag")
    } finally {
      setIsSubmitting(false)
    }
  }, [generateSlug, router])

  return (
    <div className="w-full min-w-0 space-y-6">
      <SupportSectionHeader section="tags"
        title="Create FAQ Tag"
        description="Create a new tag to organize and categorize FAQs"
        showBackButton={true}
        onBack={() => router.push('/support/faqs/tags')}
        actions={[
          {
            label: isSubmitting ? "Creating..." : "Create Tag",
            onClick: () => form.handleSubmit(onSubmit)(),
            disabled: isSubmitting
          }
        ]}
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="min-w-0 space-y-6">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
            {/* Main Content */}
            <div className="min-w-0 space-y-5">
              <Card className="min-w-0 rounded-xl shadow-xs">
                <CardHeader>
                  <CardTitle>Tag Information</CardTitle>
                </CardHeader>
                <CardContent className="min-w-0 space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tag Name *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter tag name (e.g., 'Mobile App', 'Authentication')"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          The display name for this tag
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />


                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Optional description of what this tag represents"
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Optional description to help users understand this tag&apos;s purpose
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Settings */}
            <div className="w-full min-w-0 space-y-6">
              <Card className="min-w-0 rounded-xl shadow-xs">
                <CardHeader>
                  <CardTitle>Display Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color Theme</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select color theme" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TAG_COLOR_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full border"
                                    style={{ 
                                      backgroundColor: `hsl(var(--${option.value}))`,
                                      borderColor: `hsl(var(--${option.value}))`
                                    }}
                                  />
                                  <div>
                                    <div className="font-medium">{option.label}</div>
                                    <div className="text-xs text-muted-foreground">{option.description}</div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Color theme for this tag in the UI
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Active Tag</FormLabel>
                          <FormDescription className="text-sm">
                            Active tags are available for selection when creating/editing FAQs
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

            </div>
          </div>
          <SupportFormActions label="Create tag" loading={isSubmitting} onCancel={() => router.push("/support/faqs/tags")} />
        </form>
      </Form>
    </div>
  )
}