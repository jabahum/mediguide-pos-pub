"use client"

import Link from "next/link"
import { ArrowRight, Settings } from "lucide-react"
import { SettingsSectionHeader, availableSettingsSections } from "@/components/settings/settings-section"
import { EmptyState } from "@/components/ui/empty-state"
import { Card, CardContent } from "@/components/ui/card"

export default function SettingsPage() {
  const sections = availableSettingsSections()
  return <div className="w-full min-w-0 space-y-6">
    <SettingsSectionHeader title="Settings" description="Manage notification operations and the services connected to MediGuide." />
    <section className="space-y-4" aria-labelledby="settings-heading">
      <div><h2 id="settings-heading" className="text-base font-semibold">Configuration areas</h2><p className="mt-1 text-sm text-muted-foreground">Open a service to review its configuration and available controls.</p></div>
      {sections.length ? <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))" }}>{sections.map(({ id, href, label, description, icon: Icon }) => <Link key={id} href={href} className="group flex min-w-0 flex-col gap-4 rounded-xl border bg-card p-6 shadow-xs transition-colors hover:border-primary/40 hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="flex size-12 items-center justify-center rounded-2xl bg-primary/5 text-primary"><Icon className="size-6" aria-hidden="true" /></span><div><h3 className="text-lg font-semibold">{label}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p></div><span className="mt-auto flex items-center justify-between gap-3 border-t pt-4 text-sm font-medium">Open {label.toLowerCase()}<ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></span></Link>)}</div> : <Card className="rounded-xl"><CardContent><EmptyState icon={Settings} title="No settings available" description="Your account does not have access to these configuration areas." /></CardContent></Card>}
    </section>
  </div>
}
