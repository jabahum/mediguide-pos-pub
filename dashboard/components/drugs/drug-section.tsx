"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderTree, Pill, Shield, Tags, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader, type PageHeaderProps } from "@/components/ui/page-header";
import { cn, formatStatus } from "@/lib/utils";

const sections = [
  { href: "/drugs", label: "Drug index", icon: Pill },
  { href: "/drugs/categories", label: "Categories", icon: FolderTree },
  { href: "/drugs/tags", label: "Tags", icon: Tags },
  { href: "/drugs/interactions", label: "Interactions", icon: Shield },
];

export function DrugSectionHeader({ icon: Icon = Pill, ...props }: PageHeaderProps & { icon?: LucideIcon }) {
  const pathname = usePathname();
  const active = sections.slice(1).find((section) => pathname === section.href)?.href || "/drugs";
  return <div className="space-y-5">
    <div className="flex items-start gap-3.5">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/5 text-primary"><Icon className="size-6" aria-hidden="true" /></span>
      <div className="min-w-0 flex-1"><p className="mb-1 text-xs font-semibold tracking-widest text-muted-foreground">MEDICATION LIBRARY</p><PageHeader {...props} className={cn("pb-0 [&_h1]:break-words sm:[&_h1]:text-3xl", props.className)} /></div>
    </div>
    <nav aria-label="Drug index sections" className="flex flex-wrap gap-1 rounded-xl border bg-muted/30 p-1.5">
      {sections.map(({ href, label, icon: SectionIcon }) => <Link key={href} href={href} aria-current={active === href ? "page" : undefined} className={cn("flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-4", active === href ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:bg-background/70 hover:text-foreground")}><SectionIcon className="size-4" aria-hidden="true" />{label}</Link>)}
    </nav>
  </div>;
}

export function DrugStatusBadge({ status }: { status?: string }) {
  const color = status === "active" || status === "approved"
    ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300"
    : status === "under_review" || status === "pending" || status === "needs_update"
      ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300"
      : "border-border bg-muted/50 text-muted-foreground";
  return <Badge variant="outline" className={cn("gap-1.5 rounded-full px-2.5 py-1 font-medium", color)}><span className="size-1.5 rounded-full bg-current" aria-hidden="true" />{formatStatus(status) || "Not specified"}</Badge>;
}
