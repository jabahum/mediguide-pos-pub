"use client"

import { use, useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { usePermissionContext } from "@/lib/permission-context"
import { SupportSectionHeader } from "@/components/support/support-section"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/ui/loading-state"
import { RichContent } from "@/components/ui/rich-content"
import { format, formatDistanceToNow } from "date-fns"
import { Edit, Star, Tag, User, Clock, Eye, Calendar } from "lucide-react"
import { FaqService } from "@/services/faq.service"
import { showToast } from "@/lib/toast"
import type { FaqsWithExpanded } from "@/types/expanded"

interface ViewFAQPageProps {
  params: Promise<{ id: string }>
}

export default function ViewFAQPage({ params }: ViewFAQPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { hasPermission, loading: permLoading } = usePermissionContext()
  const [isLoading, setIsLoading] = useState(true)
  const [faq, setFaq] = useState<FaqsWithExpanded | null>(null)

  useEffect(() => {
    if (permLoading) return
    if (!hasPermission("content", "read:any")) {
      router.replace("/support/faqs")
    }
  }, [permLoading, hasPermission, router])

  // Load FAQ data
  const loadFaq = useCallback(async () => {
    try {
      setIsLoading(true)
      const result = await FaqService.getFaqWithRelations(id)
      
      if (result.success && result.data) {
        setFaq(result.data as FaqsWithExpanded)
      } else {
        showToast.error("Error", result.error || "FAQ not found")
        router.push('/support/faqs')
      }
    } catch (error) {
      console.error('Error loading FAQ:', error)
      showToast.error("Error", "Failed to load FAQ")
      router.push('/support/faqs')
    } finally {
      setIsLoading(false)
    }
  }, [id, router])

  // Load data on mount
  useEffect(() => {
    loadFaq()
  }, [loadFaq])

  // Status configuration
  const getStatusConfig = (status: string) => {
    const configs = {
      draft: { label: "Draft", variant: "secondary" as const, color: "text-muted-foreground" },
      review: { label: "Under Review", variant: "default" as const, color: "text-blue-600" },
      published: { label: "Published", variant: "default" as const, color: "text-green-600" },
      archived: { label: "Archived", variant: "outline" as const, color: "text-muted-foreground" },
    }
    return configs[status as keyof typeof configs] || configs.draft
  }

  // Priority configuration
  const getPriorityConfig = (priority: string) => {
    const configs = {
      low: { label: "Low", variant: "outline" as const },
      normal: { label: "Normal", variant: "secondary" as const },
      high: { label: "High", variant: "default" as const },
      critical: { label: "Critical", variant: "destructive" as const },
    }
    return configs[priority as keyof typeof configs] || configs.normal
  }

  // Audience labels
  const getAudienceLabel = (audience: string) => {
    const labels = {
      all: "All Users",
      admin: "Administrators",
      health_worker: "Health Workers", 
      patient: "Patients",
    }
    return labels[audience as keyof typeof labels] || audience
  }

  if (isLoading) {
    return (
      <div className="w-full min-w-0 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <LoadingState message="Loading FAQ..." />
      </div>
    )
  }

  if (!faq) {
    return (
      <div className="w-full min-w-0 space-y-6">
        <SupportSectionHeader section="faqs"
          title="FAQ Not Found"
          description="The requested FAQ could not be found"
          showBackButton={true}
          onBack={() => router.push('/support/faqs')}
        />
      </div>
    )
  }

  const statusConfig = getStatusConfig(faq.status || 'draft')
  const priorityConfig = getPriorityConfig(faq.priority || 'normal')

  return (
    <div className="w-full min-w-0 space-y-6">
      <SupportSectionHeader section="faqs"
        title={faq.question}
        description={`FAQ • ${statusConfig.label}`}
        showBackButton={true}
        onBack={() => router.push('/support/faqs')}
        actions={[
          {
            label: "Edit FAQ",
            onClick: () => router.push(`/support/faqs/${faq.id}/edit`),
            icon: <Edit className="h-4 w-4" />
          }
        ]}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        {/* Main Content */}
        <div className="min-w-0 space-y-5">
          {/* FAQ Content */}
          <Card className="min-w-0 rounded-xl shadow-xs">
            <CardHeader className="space-y-4">
              <div className="flex items-start justify-between">
                <CardTitle className="text-xl leading-7">
                  {faq.question}
                  {faq.is_featured && (
                    <Badge variant="secondary" className="ml-3">
                      <Star className="h-3 w-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                </CardTitle>
              </div>
              
              {/* Status and Priority Badges */}
              <div className="flex items-center gap-2">
                <Badge variant={statusConfig.variant}>
                  {statusConfig.label}
                </Badge>
                <Badge variant={priorityConfig.variant}>
                  {priorityConfig.label}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="min-w-0 space-y-6">
              {/* Answer Content */}
              <div className="prose prose-sm max-w-none">
                <RichContent className="text-base leading-7" html={faq.answer} />
              </div>

              {/* Keywords */}
              {faq.keywords && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Keywords</h4>
                    <p className="text-sm">{faq.keywords}</p>
                  </div>
                </>
              )}

              {/* Tags */}
              {faq.expand?.tags && faq.expand.tags.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Tags
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {faq.expand.tags.map((tag) => (
                        <Badge 
                          key={tag.id}
                          variant="outline"
                          className="text-sm"
                          style={{ 
                            borderColor: `hsl(var(--${tag.color || 'primary'}))`,
                            color: `hsl(var(--${tag.color || 'primary'}))`
                          }}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Related FAQs */}
          {faq.expand?.related_faqs && faq.expand.related_faqs.length > 0 && (
            <Card className="min-w-0 rounded-xl shadow-xs">
              <CardHeader>
                <CardTitle className="text-lg">Related FAQs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {faq.expand.related_faqs.map((relatedFaq) => (
                    <div key={relatedFaq.id} className="p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <Button
                        variant="ghost"
                        className="h-auto p-0 text-left justify-start"
                        onClick={() => router.push(`/support/faqs/${relatedFaq.id}`)}
                      >
                        <div className="space-y-1">
                          <p className="font-medium text-sm">{relatedFaq.question}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Eye className="h-3 w-3" />
                            View FAQ
                          </div>
                        </div>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Information */}
        <div className="w-full min-w-0 space-y-6">
          {/* FAQ Details */}
          <Card className="min-w-0 rounded-xl shadow-xs">
            <CardHeader>
              <CardTitle className="text-lg">FAQ Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Target Audience */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Target Audience</span>
                <span className="text-sm font-medium">
                  {getAudienceLabel(faq.target_audience || 'all')}
                </span>
              </div>

              {/* Sort Order */}
              {faq.sort_order !== undefined && faq.sort_order > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Sort Order</span>
                  <span className="text-sm font-medium">#{faq.sort_order}</span>
                </div>
              )}

              <Separator />

              {/* Creation Date */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Created
                </span>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {format(new Date(faq.created), "MMM dd, yyyy")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(faq.created), { addSuffix: true })}
                  </div>
                </div>
              </div>

              {/* Last Updated */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Updated
                </span>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {format(new Date(faq.updated), "MMM dd, yyyy")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(faq.updated), { addSuffix: true })}
                  </div>
                </div>
              </div>

              {/* Published Date */}
              {faq.status === 'published' && faq.published_at && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Published</span>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {format(new Date(faq.published_at), "MMM dd, yyyy")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(faq.published_at), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Author Information */}
          {faq.expand?.author && (
            <Card className="min-w-0 rounded-xl shadow-xs">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Author
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={faq.expand.author.avatar} alt={faq.expand.author.name || 'Author'} />
                    <AvatarFallback>
                      {(faq.expand.author.name || 'AU').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{faq.expand.author.name || 'Unknown Author'}</p>
                    <p className="text-xs text-muted-foreground">{faq.expand.author.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reviewer Information */}
          {faq.expand?.reviewer && (
            <Card className="min-w-0 rounded-xl shadow-xs">
              <CardHeader>
                <CardTitle className="text-lg">Reviewer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={faq.expand.reviewer.avatar} alt={faq.expand.reviewer.name || 'Reviewer'} />
                    <AvatarFallback>
                      {(faq.expand.reviewer.name || 'RE').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{faq.expand.reviewer.name || 'Unknown Reviewer'}</p>
                    <p className="text-xs text-muted-foreground">{faq.expand.reviewer.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
