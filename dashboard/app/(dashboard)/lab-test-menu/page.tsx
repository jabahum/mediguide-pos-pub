"use client"

import { useState, useEffect, useMemo } from "react"
import { useDashboardRouter as useRouter } from "@/components/dialogs/create-dialog-context"
import { usePermissionContext } from "@/lib/permission-context"
import Head from "next/head"
import { Edit, Plus, TestTube } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { PageLoading } from "@/components/ui/loading-state"
import { RichContent } from "@/components/ui/rich-content"
import { GenericPageInfoDialog } from "@/components/dialogs/generic-page-info-dialog"
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog"
import { GenericPagesService } from "@/services/generic-pages.service"
import { useGenericPage } from "@/hooks/use-generic-page"
import { showToast } from "@/lib/toast"
import type {
  ContentDeleteState
} from "./types"

const PAGE_KEY = "lab-test-menu" as const

// Utility to truncate title for browser tab
const truncateTitle = (title: string, maxChars: number = 50): string => {
  if (title.length <= maxChars) return title
  return title.substring(0, maxChars - 3) + "..."
}

export default function LabTestMenuPage() {
  const router = useRouter()
  const { page, loading, refresh: loadPage } = useGenericPage(PAGE_KEY)
  const { hasPermission, loading: permLoading } = usePermissionContext()

  useEffect(() => {
    if (permLoading) return
    if (!hasPermission("content", "read:any")) {
      router.replace("/")
    }
  }, [permLoading, hasPermission, router])
  const [activeTab, setActiveTab] = useState("overview")

  // Dialog states (only for page info and delete)
  const [dialogs, setDialogs] = useState({
    pageInfo: false,
    delete: false,
    deleteLoading: false
  })

  // Content deletion state
  const [deletingContent, setDeletingContent] = useState<ContentDeleteState>({
    key: "",
    title: ""
  })

  // Get content keys for tabs
  const contentKeys = useMemo(() => {
    if (!page?.content) return []
    return Object.keys(page.content)
  }, [page?.content])

  // Set initial active tab when page loads (only once)
  useEffect(() => {
    if (page && contentKeys.length > 0) {
      // Only set tab if current activeTab is not valid
      if (!contentKeys.includes(activeTab)) {
        setActiveTab(contentKeys[0])
      }
    } else if (!page) {
      setActiveTab("overview")
    }
  }, [page, contentKeys, activeTab])

  // Detect content structure type
  const contentStructure = useMemo(() => {
    if (!page?.content) return "simple"
    return typeof page.content === "object" && page.content !== null ? "keyed" : "simple"
  }, [page?.content])

  // Event handlers using navigation
  const handlers = {
    createPage: () => setDialogs(prev => ({ ...prev, pageInfo: true })),
    
    editPageInfo: () => setDialogs(prev => ({ ...prev, pageInfo: true })),
    
    addContent: () => {
      if (!page) {
        showToast.error("Page Not Found", "Please create the page first")
        return
      }
      
      // Navigate to create content page
      if (contentStructure === "keyed") {
        router.push(`/generic-pages/${PAGE_KEY}/content/create?returnTo=/lab-test-menu`)
      } else {
        router.push(`/generic-pages/${PAGE_KEY}/content/create?returnTo=/lab-test-menu`)
      }
    },
    
    editContent: (contentKey: string) => {
      if (!page?.content) return
      
      // Navigate to edit content page
      if (contentStructure === "keyed") {
        router.push(`/generic-pages/${PAGE_KEY}/content/edit?contentKey=${contentKey}&returnTo=/lab-test-menu`)
      } else {
        router.push(`/generic-pages/${PAGE_KEY}/content/edit?returnTo=/lab-test-menu`)
      }
    },
    
    deleteContent: (contentKey: string) => {
      const content = page?.content?.[contentKey]
      if (content) {
        setDeletingContent({ key: contentKey, title: content.title })
        setDialogs(prev => ({ ...prev, delete: true }))
      }
    },
    
    dialogSuccess: () => loadPage(),
    
    confirmDelete: async () => {
      if (!deletingContent.key) return
      
      setDialogs(prev => ({ ...prev, deleteLoading: true }))
      try {
        await GenericPagesService.deleteContent(PAGE_KEY, deletingContent.key)
        showToast.success("Content Deleted", "Content section has been deleted successfully")
        await loadPage()

        // Reset delete state
        setDeletingContent({ key: "", title: "" })
      } catch (error) {
        console.error("Error deleting content:", error)
        showToast.error(
          "Delete Failed", 
          error instanceof Error ? error.message : "Failed to delete content"
        )
      } finally {
        setDialogs(prev => ({ ...prev, deleteLoading: false }))
      }
    }
  } as const

  // Generate page title for browser tab
  const pageTitle = page?.title 
    ? `${truncateTitle(page.title)} - MediGuide` 
    : "Lab Test Menu - MediGuide"

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
      </Head>
      {loading ? (
        <PageLoading message="Loading page..." />
      ) : !page ? (
        <div className="space-y-6">
          {/* Show default page header with actions */}
          <PageHeader
            title="Lab Test Menu"
            description="Create and manage laboratory test protocols"
            actions={[
              {
                label: "Create Lab Test Menu",
                onClick: handlers.createPage,
                icon: <Plus className="h-4 w-4" />
              }
            ]}
          />

          {/* Empty state */}
          <Card>
            <CardContent>
              <EmptyState
                icon={TestTube}
                title="Lab Test Menu Not Set Up"
                description="This page hasn't been created yet. Get started by creating your laboratory test menu page."
                action={{
                  label: "Create Lab Test Menu",
                  onClick: handlers.createPage,
                  icon: <Plus className="h-4 w-4" />
                }}
              />
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Page Header */}
          <PageHeader
            title={page.title}
            description={page.description}
            actions={[
              {
                label: "Edit Page Info",
                onClick: handlers.editPageInfo,
                icon: <Edit className="h-4 w-4" />,
                variant: "outline"
              },
              {
                label: "Add Content",
                onClick: handlers.addContent,
                icon: <Plus className="h-4 w-4" />
              }
            ]}
          />

          {/* Content Layout */}
          {contentKeys.length > 0 ? (
            <div className="grid gap-6 xl:grid-cols-[260px_1fr]">
              <aside className="w-full xl:sticky xl:top-6">
                <div className="rounded-xl border border-sidebar-border bg-sidebar text-sidebar-foreground">
                  <div className="border-b border-sidebar-border px-4 py-3">
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-sidebar-foreground/70">
                      Sections
                    </h2>
                  </div>
                  <div className="p-2">
                    <div className="space-y-1">
                      {contentKeys.map((key) => {
                        const content = page.content?.[key]
                        const isActive = key === activeTab
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setActiveTab(key)}
                            className={[
                              "w-full rounded-md px-3 py-2 text-left text-sm transition",
                              isActive
                                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                            ].join(" ")}
                          >
                            <div className="font-medium truncate">
                              {content?.title || key}
                            </div>
                            {content && "description" in content && typeof content.description === "string" && content.description && (
                              <div className="mt-1 line-clamp-2 text-xs text-sidebar-foreground/60">
                                {content.description}
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </aside>

              {contentKeys.map((key) => {
                const content = page.content?.[key]
                if (!content || key !== activeTab) return null

                return (
                  <Card key={key} className="min-w-0">
                    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4">
                      <div className="min-w-0">
                        <CardTitle className="truncate">{content.title}</CardTitle>
                        {content && "description" in content && typeof content.description === "string" && content.description && (
                          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                            {content.description}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlers.editContent(key)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlers.deleteContent(key)}
                        >
                          Delete
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <RichContent className="prose max-w-none" html={content.content} />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardContent>
                <EmptyState
                  icon={TestTube}
                  title="No Content Sections"
                  description="Start building your laboratory test menu by adding content sections. Each section will become a tab."
                  action={{
                    label: "Add First Content Section",
                    onClick: handlers.addContent,
                    icon: <Plus className="h-4 w-4" />
                  }}
                />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Dialogs - rendered only once */}
      <GenericPageInfoDialog
        pageKey={PAGE_KEY}
        currentTitle={page?.title || ""}
        currentDescription={page?.description || ""}
        open={dialogs.pageInfo}
        onOpenChange={(open) => setDialogs(prev => ({ ...prev, pageInfo: open }))}
        onSuccess={handlers.dialogSuccess}
      />


      <ConfirmDialog
        open={dialogs.delete}
        onOpenChange={(open) => setDialogs(prev => ({ ...prev, delete: open }))}
        title="Delete Content Section"
        description={`Are you sure you want to delete "${deletingContent.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handlers.confirmDelete}
        loading={dialogs.deleteLoading}
      />
    </>
  )
}
