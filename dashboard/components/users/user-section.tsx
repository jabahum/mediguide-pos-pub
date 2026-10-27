"use client"

import Link from "next/link"
import { ShieldCheck, Users, type LucideIcon } from "lucide-react"
import { PageHeader, type PageHeaderProps } from "@/components/ui/page-header"
import { Badge } from "@/components/ui/badge"
import { usePermissionContext } from "@/lib/permission-context"
import { cn, formatStatus } from "@/lib/utils"

export function UserSectionHeader({ section = "users", icon: Icon = Users, description, onNavigate, ...props }: PageHeaderProps & { section?: "users" | "roles"; icon?: LucideIcon; onNavigate?: (href: string) => void }) {
  const { hasPermission } = usePermissionContext()
  const sections = [
    { id: "users", href: "/users", label: "User directory", icon: Users, resource: "users" },
    { id: "roles", href: "/users/roles", label: "Roles & permissions", icon: ShieldCheck, resource: "roles" },
  ]
  return <div className="space-y-5">
    <div className="flex items-start gap-3.5">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/5 text-primary"><Icon className="size-6" aria-hidden="true" /></span>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-xs font-semibold tracking-widest text-muted-foreground">PEOPLE & ACCESS</p>
        <PageHeader {...props} className={cn("pb-0 [&_h1]:break-words sm:[&_h1]:text-3xl", props.className)} />
        {description && <p className="text-sm leading-6 text-muted-foreground">{description}</p>}
      </div>
    </div>
    <nav aria-label="User management sections" className="flex flex-wrap gap-1 rounded-xl border bg-muted/30 p-1.5">
      {sections.filter(item => hasPermission(item.resource, "read:any")).map(({ id, href, label, icon: SectionIcon }) => <Link key={id} href={href} onClick={onNavigate ? event => { event.preventDefault(); onNavigate(href) } : undefined} aria-current={section === id ? "page" : undefined} className={cn("flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-4", section === id ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:bg-background/70 hover:text-foreground")}><SectionIcon className="size-4" aria-hidden="true" />{label}</Link>)}
    </nav>
  </div>
}

export function UserStatusBadge({ status }: { status?: string }) {
  const normalized = status === "pendingActivation" ? "pending_activation" : status
  const tone = normalized === "active"
    ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300"
    : normalized === "pending_activation"
      ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300"
      : normalized === "suspended"
        ? "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300"
        : "border-border bg-muted/50 text-muted-foreground"
  return <Badge variant="outline" className={cn("gap-1.5 rounded-full px-2.5 py-1 font-medium", tone)}><span className="size-1.5 rounded-full bg-current" aria-hidden="true" />{formatStatus(normalized) || "Not specified"}</Badge>
}

export const userFormSections = [
  { id: "personal", title: "Personal information", description: "Identity and contact details" },
  { id: "professional", title: "Professional information", description: "Role, status and workplace" },
  { id: "location", title: "Location information", description: "Address and geographic details" },
  { id: "settings", title: "System settings", description: "Preferences and additional notes" },
]

export function UserFormNavigation() {
  return <div className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-sm font-semibold">Account details</h2><p className="text-xs text-muted-foreground">Fields marked * are required</p></div><nav aria-label="User form sections" className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{userFormSections.map((item, index) => <a key={item.id} href={`#user-${item.id}`} className="flex items-start gap-3 rounded-xl border bg-card p-3 transition-colors hover:border-primary/40 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold">{index + 1}</span><span><span className="block text-sm font-medium">{item.title}</span><span className="mt-0.5 block text-xs text-muted-foreground">{item.description}</span></span></a>)}</nav></div>
}
