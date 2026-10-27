"use client"

import Link from "next/link"
import { Activity, FileText, FolderOpen } from "lucide-react"
import { hasBackendPermission } from "@/lib/backend-client"
import { outbreakNavigationItems, type OutbreakSection } from "@/lib/outbreak-navigation"
import { cn } from "@/lib/utils"

const icons = { outbreaks: Activity, reports: FileText, resources: FolderOpen }

export function OutbreakSectionNavigation({ section }: { section: OutbreakSection }) {
  const items = outbreakNavigationItems.filter(item => hasBackendPermission(item.permission))
  if (!items.length) return null
  return <nav aria-label="Outbreak management sections" className="flex flex-wrap gap-1 rounded-xl border bg-muted/30 p-1.5">
    {items.map(({ id, href, label }) => {
      const Icon = icons[id]
      return <Link key={id} href={href} aria-current={section === id ? "page" : undefined} className={cn("flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-4", section === id ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:bg-background/70 hover:text-foreground")}><Icon className="size-4" aria-hidden="true" />{label}</Link>
    })}
  </nav>
}
