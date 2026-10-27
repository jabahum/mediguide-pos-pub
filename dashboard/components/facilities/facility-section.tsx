"use client"

import Link from "next/link"
import { Building2, Layers, MapPinned } from "lucide-react"
import type { PageHeaderProps } from "@/components/ui/page-header"
import { WorkspaceSectionHeader } from "@/components/ui/workspace-section-header"
import { cn } from "@/lib/utils"

const geography = [
  { id: "regions", label: "Regions" }, { id: "health-sub-regions", label: "Health sub-regions" },
  { id: "districts", label: "Districts" }, { id: "counties", label: "Counties" },
  { id: "health-sub-districts", label: "Health sub-districts" }, { id: "subcounties", label: "Subcounties" },
  { id: "parishes", label: "Parishes" },
]
const classification = [
  { id: "facility-levels", label: "Facility levels" }, { id: "ownership-types", label: "Ownership types" },
  { id: "authorities", label: "Authorities" },
]
const groups = [
  { id: "directory", href: "/health-facilities", label: "Facility directory", icon: Building2 },
  { id: "geography", href: "/health-facilities/regions", label: "Geography", icon: MapPinned },
  { id: "classification", href: "/health-facilities/facility-levels", label: "Classification", icon: Layers },
]

export function FacilitySectionHeader({ section = "directory", ...props }: PageHeaderProps & { section?: string }) {
  const group = geography.some(item => item.id === section) ? "geography" : classification.some(item => item.id === section) ? "classification" : "directory"
  const children = group === "geography" ? geography : group === "classification" ? classification : []
  return <div className="space-y-4">
    <WorkspaceSectionHeader {...props} eyebrow="HEALTH FACILITY NETWORK" section={group} icon={groups.find(item => item.id === group)!.icon} sections={groups} navigationLabel="Health facility sections" />
    {children.length > 0 && <nav aria-label={`${group === "geography" ? "Geographic" : "Classification"} reference pages`} className="flex flex-wrap gap-2">{children.map(({ id, label }) => <Link key={id} href={`/health-facilities/${id}`} aria-current={section === id ? "page" : undefined} className={cn("rounded-full border px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", section === id ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground")}>{label}</Link>)}</nav>}
  </div>
}

export function FacilityFormNavigation() {
  return <div className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-sm font-semibold">Facility information</h2><p className="text-xs text-muted-foreground">All facility fields are required</p></div><nav aria-label="Facility form sections" className="grid gap-3 sm:grid-cols-3">{[{ id: "identity", label: "Identity & codes", detail: "Facility name, NHPI and HSDT codes" }, { id: "classification", label: "Classification", detail: "Level, authority and ownership" }, { id: "location", label: "Geographic location", detail: "Select parent areas before child areas" }].map((item, index) => <a key={item.id} href={`#facility-${item.id}`} className="flex items-start gap-3 rounded-xl border bg-card p-3 transition-colors hover:border-primary/40 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold">{index + 1}</span><span><span className="block text-sm font-medium">{item.label}</span><span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{item.detail}</span></span></a>)}</nav></div>
}
