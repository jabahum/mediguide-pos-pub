"use client"

import { useSectionNavigation } from "@/hooks/use-section-navigation"
import Link from "next/link"
import { Calculator, FolderTree, Library, Play, ShieldCheck, type LucideIcon } from "lucide-react"
import { PageHeader, type PageHeaderProps } from "@/components/ui/page-header"
import { Badge } from "@/components/ui/badge"
import { hasBackendPermission } from "@/lib/backend-client"
import { cn, formatStatus } from "@/lib/utils"

const sections = [
  { id: "library", href: "/decision-tools", label: "Tool library", icon: Library },
  { id: "run", href: "/decision-tools/calculators", label: "Run tools", icon: Play },
  { id: "review", href: "/decision-tools/review", label: "Clinical review", icon: ShieldCheck },
  { id: "categories", href: "/decision-tools/categories", label: "Categories", icon: FolderTree },
] as const

type ToolSection = typeof sections[number]["id"]

export function ToolSectionHeader({ showNavigation = true, section = "library", icon: Icon = Calculator, description, ...props }: PageHeaderProps & { showNavigation?: boolean; section?: ToolSection; icon?: LucideIcon }) {
  const showSections = useSectionNavigation(showNavigation)
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3.5">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/5 text-primary">
          <Icon className="size-6" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-xs font-semibold tracking-widest text-muted-foreground">CLINICAL DECISION SUPPORT</p>
          <PageHeader {...props} className={cn("pb-0 [&_h1]:break-words sm:[&_h1]:text-3xl", props.className)} />
          {description && <p className="text-sm leading-6 text-muted-foreground">{description}</p>}
        </div>
      </div>
      {showSections && <nav aria-label="Decision tool sections" className="flex flex-wrap gap-1 rounded-xl border bg-muted/30 p-1.5">
        {sections.filter(item => item.id !== "review" || hasBackendPermission("calculator.review")).map(({ id, href, label, icon: SectionIcon }) => (
          <Link key={id} href={href} aria-current={section === id ? "page" : undefined} className={cn("flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-4", section === id ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:bg-background/70 hover:text-foreground")}>
            <SectionIcon className="size-4" aria-hidden="true" />{label}
          </Link>
        ))}
      </nav>}
    </div>
  )
}

export function ToolStatusBadge({ status }: { status?: string }) {
  const tone = status === "active" || status === "published"
    ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300"
    : status === "pending_review" || status === "under_review"
      ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300"
      : status === "approved"
        ? "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300"
        : "border-border bg-muted/50 text-muted-foreground"
  return <Badge variant="outline" className={cn("gap-1.5 rounded-full px-2.5 py-1 font-medium", tone)}><span aria-hidden="true" className="size-1.5 rounded-full bg-current" />{formatStatus(status) || "Not specified"}</Badge>
}

const workflow = [
  { title: "Tool details", description: "Name, category and availability" },
  { title: "Author & test", description: "Definition, validation and fixtures" },
  { title: "Clinical review", description: "Evidence and reviewer approval" },
  { title: "Publish", description: "Make the approved version available" },
]

export function ToolWorkflowGuide({ step }: { step: number }) {
  return <ol aria-label="Tool publishing workflow" className="grid gap-3 rounded-xl border bg-muted/20 p-4 sm:grid-cols-2 xl:grid-cols-4">
    {workflow.map((item, index) => <li key={item.title} aria-current={step === index + 1 ? "step" : undefined} className="flex items-start gap-3">
      <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold", step === index + 1 ? "border-primary bg-primary text-primary-foreground" : "bg-background text-muted-foreground")}>{index + 1}</span>
      <div><p className="text-sm font-medium">{item.title}</p><p className="mt-0.5 text-xs leading-5 text-muted-foreground">{item.description}</p></div>
    </li>)}
  </ol>
}
