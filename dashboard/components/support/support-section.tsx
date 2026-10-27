"use client"

import { BookOpen, Headphones, Save, MessageCircleQuestion, Tags, type LucideIcon } from "lucide-react"
import type { PageHeaderProps } from "@/components/ui/page-header"
import { WorkspaceSectionHeader } from "@/components/ui/workspace-section-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn, formatStatus } from "@/lib/utils"

const sections = [
  { id: "tickets", href: "/support", label: "Support tickets", icon: Headphones },
  { id: "documentation", href: "/support/documentation", label: "Documentation", icon: BookOpen },
  { id: "faqs", href: "/support/faqs", label: "FAQs", icon: MessageCircleQuestion },
  { id: "tags", href: "/support/faqs/tags", label: "FAQ tags", icon: Tags },
] as const

export function SupportSectionHeader({ section = "tickets", icon, ...props }: PageHeaderProps & { section?: typeof sections[number]["id"]; icon?: LucideIcon }) {
  return <WorkspaceSectionHeader {...props} eyebrow="SUPPORT & KNOWLEDGE" icon={icon || sections.find(item => item.id === section)!.icon} section={section} sections={[...sections]} navigationLabel="Support sections" />
}

export function SupportStatusBadge({ status }: { status?: string }) {
  const tone = ["published", "active", "resolved"].includes(status || "")
    ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300"
    : ["review", "in_progress", "pending", "pending_review"].includes(status || "")
      ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300"
      : "border-border bg-muted/50 text-muted-foreground"
  return <Badge variant="outline" className={cn("gap-1.5 rounded-full px-2.5 py-1 font-medium", tone)}><span className="size-1.5 rounded-full bg-current" aria-hidden="true" />{formatStatus(status) || "Not specified"}</Badge>
}

export function SupportFormActions({ label, loading, onCancel }: { label: string; loading: boolean; onCancel: () => void }) {
  return <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/20 p-4"><p className="text-sm text-muted-foreground">Review your changes before saving.</p><div className="flex gap-2"><Button type="button" variant="outline" disabled={loading} onClick={onCancel}>Cancel</Button><Button type="submit" disabled={loading}><Save className="size-4" aria-hidden="true" />{loading ? "Saving…" : label}</Button></div></div>
}
