"use client"

import { useState, useEffect } from "react"
import { useCreateSearchParams as useSearchParams, useDashboardRouter as useRouter } from "@/components/dialogs/create-dialog-context"
import { useQueryClient } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Save, FileText, Key, Settings } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { LoadingState } from "@/components/ui/loading-state"
import { GenericPagesService } from "@/services/generic-pages.service"
import { genericPageQueryKey } from "@/hooks/use-generic-page"
import { showToast } from "@/lib/toast"
import { usePermissionContext } from "@/lib/permission-context"

const createFormSchema = (hasKey: boolean) => z.object({
  title: hasKey ? z.string().min(1, "Title is required").max(255, "Title is too long") : z.string().optional(),
  content: z.string().min(1, "Content is required"),
})

type FormData = z.infer<ReturnType<typeof createFormSchema>>

export default function CreateContentPage({ pageKey }: { pageKey: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const resolvedParams = { pageKey }
  const queryClient = useQueryClient()
  const { hasPermission, loading: permLoading } = usePermissionContext()

  useEffect(() => {
    if (permLoading) return
    if (!hasPermission("content", "create:any")) {
      const returnTo = searchParams.get("returnTo") || `/lab-test-menu`
      router.replace(returnTo)
    }
  }, [permLoading, hasPermission, router, searchParams])

  const returnTo = searchParams.get("returnTo") || `/lab-test-menu`

  const [selectedTemplate, setSelectedTemplate] = useState<"key-value" | "simple">("key-value")
  const hasKey = selectedTemplate === "key-value"
  const [loading, setLoading] = useState(false)
  const [pageExists, setPageExists] = useState(false)
  const [checkingPage, setCheckingPage] = useState(true)

  const form = useForm<FormData>({
    resolver: zodResolver(createFormSchema(hasKey)),
    defaultValues: { title: "", content: undefined },
  })

  // Update form validation when template changes
  useEffect(() => {
    form.clearErrors()
    form.control._options.resolver = zodResolver(createFormSchema(hasKey))
  }, [hasKey, form])

  // Check if page exists
  useEffect(() => {
    GenericPagesService.getPageByKey(resolvedParams.pageKey)
      .then(page => setPageExists(Boolean(page)))
      .catch(() => setPageExists(false))
      .finally(() => setCheckingPage(false))
  }, [resolvedParams.pageKey])

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      if (hasKey) {
        const currentContentKey = (data.title || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
        if (!currentContentKey) {
          console.log(currentContentKey, "----------")
          showToast.error("Missing Key", "Please enter a title to generate a content key")
          setLoading(false)
          return
        }

        await GenericPagesService.addContent(resolvedParams.pageKey, currentContentKey, {
          title: data.title || "",
          content: data.content
        })
      } else {
        await GenericPagesService.updatePageContent(resolvedParams.pageKey, data.content)
      }

      showToast.success("Content Created", `${hasKey ? "Content section" : "Page content"} has been created successfully`)
      await queryClient.invalidateQueries({ queryKey: genericPageQueryKey(resolvedParams.pageKey) })
      router.push(returnTo)
    } catch (error) {
      console.log(error, "Eroor")
      showToast.error("Creation Failed", error instanceof Error ? error.message : "Failed to create content")
    } finally {
      setLoading(false)
    }
  }


  if (checkingPage) return <LoadingState message="Checking page..." />

  if (!pageExists) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Page Not Found"
          description="The requested page does not exist"
          showBackButton={true}
          onBack={() => router.push(returnTo)}
        />
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              The page &quot;{resolvedParams.pageKey}&quot; does not exist. Please create it first.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const templateItems = [
    { label: "Key-Value Section", onClick: () => setSelectedTemplate("key-value"), icon: <Key className="h-4 w-4" /> },
    { label: "Simple Content", onClick: () => setSelectedTemplate("simple"), icon: <FileText className="h-4 w-4" /> }
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Content"
        description={`Add content to ${resolvedParams.pageKey}`}
        showBackButton={true}
        onBack={() => router.push(returnTo)}
        actions={[
          {
            label: "Template",
            onClick: () => { },
            variant: "outline",
            icon: <Settings className="h-4 w-4" />,
            dropdownItems: templateItems
          },
          {
            label: loading ? "Creating..." : "Create Content",
            onClick: () => form.handleSubmit(onSubmit)(),
            disabled: loading,
            icon: <Save className="h-4 w-4" />
          }
        ]}
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {hasKey && (
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Section Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter section title"
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Content</FormLabel>
                <FormControl>
                  <div className="min-h-[400px]">
                    <RichTextEditor
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  )
}
