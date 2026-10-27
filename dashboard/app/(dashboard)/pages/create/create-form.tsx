"use client"

import { useState, useEffect } from "react"
import { useDashboardRouter as useRouter } from "@/components/dialogs/create-dialog-context"
import { usePermissionContext } from "@/lib/permission-context"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Save, FileText, Key, Settings } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { LoadingState } from "@/components/ui/loading-state"
import { GenericPagesService } from "@/services/generic-pages.service"
import { showToast } from "@/lib/toast"

const createPageSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title is too long"),
  description: z.string().max(500, "Description is too long").optional(),
  contentType: z.enum(["html", "keyvalue"]),
  content: z.string().optional(),
})

type FormData = z.infer<typeof createPageSchema>

export default function CreatePagePage() {
  const router = useRouter()
  const { hasPermission, loading: permLoading } = usePermissionContext()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (permLoading) return
    if (!hasPermission("content", "create:any")) {
      router.replace("/pages")
    }
  }, [permLoading, hasPermission, router])

  const form = useForm<FormData>({
    resolver: zodResolver(createPageSchema),
    defaultValues: {
      title: "",
      description: "",
      contentType: "html",
      content: "",
    },
  })

  const contentType = form.watch("contentType")

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      // Generate key from title
      const generatedKey = GenericPagesService.generateSlug(data.title)

      // Create the page first
      const newPage = await GenericPagesService.createPage(
        generatedKey,
        data.title,
        data.description
      )

      // If HTML content type and content provided, update page content
      if (data.contentType === "html" && data.content) {
        await GenericPagesService.updatePageContent(generatedKey, data.content)
      }

      showToast.success("Page Created", `Page "${data.title}" has been created successfully`)

      // Redirect based on content type
      if (data.contentType === "keyvalue") {
        // For key-value, redirect to content management to add first section
        router.push(`/generic-pages/${generatedKey}/content/create?returnTo=/pages/${newPage.id}`)
      } else {
        // For HTML, redirect to view page
        router.push(`/pages/${newPage.id}`)
      }
    } catch (error) {
      showToast.error("Creation Failed", error instanceof Error ? error.message : "Failed to create page")
    } finally {
      setLoading(false)
    }
  }


  if (loading) return <LoadingState message="Creating page..." />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create New Page"
        description="Create a new generic page for content management"
        showBackButton={true}
        onBack={() => router.push('/pages')}
        actions={[
          {
            label: loading ? "Creating..." : "Create Page",
            onClick: () => form.handleSubmit(onSubmit)(),
            disabled: loading,
            icon: <Save className="h-4 w-4" />
          }
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Page Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter page title"
                        {...field}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormDescription>
                      The display title for this page. A unique key will be automatically generated from the title.
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
                        placeholder="Enter page description (optional)"
                        {...field}
                        disabled={loading}
                        rows={3}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional description to help identify this page&apos;s purpose
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contentType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Content Type</FormLabel>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={loading}
                        className="flex flex-col space-y-2"
                      >
                        <div className="flex items-center space-x-2 p-4 border rounded-lg">
                          <RadioGroupItem value="html" id="html" />
                          <div className="flex-1">
                            <Label htmlFor="html" className="cursor-pointer">
                              <div className="flex items-center gap-2 font-medium">
                                <FileText className="h-4 w-4" />
                                HTML Content
                              </div>
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              Single page with rich text editor for HTML content
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 p-4 border rounded-lg">
                          <RadioGroupItem value="keyvalue" id="keyvalue" />
                          <div className="flex-1">
                            <Label htmlFor="keyvalue" className="cursor-pointer">
                              <div className="flex items-center gap-2 font-medium">
                                <Key className="h-4 w-4" />
                                Key-Value Sections
                              </div>
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              Multiple tabs with organized content sections (like lab tests)
                            </p>
                          </div>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {contentType === "html" && (
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <div className="min-h-[400px]">
                          <RichTextEditor
                            value={field.value || ""}
                            onChange={field.onChange}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        HTML content for this page. You can edit this later.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {contentType === "keyvalue" && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Settings className="h-4 w-4" />
                    <span className="font-medium text-sm">Key-Value Content</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    After creating this page, you&apos;ll be able to add multiple content sections.
                    Each section will become a tab with its own title and content.
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => router.push('/pages')}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
