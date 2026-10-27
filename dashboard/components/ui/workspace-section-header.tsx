"use client"

import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { PageHeader, type PageHeaderProps } from "@/components/ui/page-header"
import { cn } from "@/lib/utils"

export type WorkspaceSection = { id: string; href: string; label: string; icon: LucideIcon }

export function WorkspaceSectionHeader({ eyebrow, icon: Icon, section, sections, navigationLabel, description, ...props }: PageHeaderProps & {
  eyebrow: string; icon: LucideIcon; section: string; sections: WorkspaceSection[]; navigationLabel: string
}) {
  return <div className="space-y-5">
    <div className="flex items-start gap-3.5">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/5 text-primary"><Icon className="size-6" aria-hidden="true" /></span>
      <div className="min-w-0 flex-1 space-y-1"><p className="text-xs font-semibold tracking-widest text-muted-foreground">{eyebrow}</p><PageHeader {...props} className={cn("pb-0 [&_h1]:break-words sm:[&_h1]:text-3xl", props.className)} />{description && <p className="text-sm leading-6 text-muted-foreground">{description}</p>}</div>
    </div>
    <nav aria-label={navigationLabel} className="flex flex-wrap gap-1 rounded-xl border bg-muted/30 p-1.5">
      {sections.map(({ id, href, label, icon: SectionIcon }) => <Link key={id} href={href} aria-current={section === id ? "page" : undefined} className={cn("flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-4", section === id ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:bg-background/70 hover:text-foreground")}><SectionIcon className="size-4" aria-hidden="true" />{label}</Link>)}
    </nav>
  </div>
}
