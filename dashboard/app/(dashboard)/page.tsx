"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Activity, AlertTriangle, BarChart3, Building2, ClipboardCheck, Hospital, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { getBackendClient, hasBackendPermission } from "@/lib/backend-client"
import type { OverviewData } from "@/types/overview"
import { OverviewEngagementChart, OverviewFeatureUsageChart, OverviewSeriesChart } from "@/components/dashboard/overview-charts"
import { StatCard } from "@/components/dashboard/stat-card"
import { DashboardHeader, DashboardLoading } from "@/components/dashboard/dashboard-header"

function SummaryPanel({ title, description, items }: { title: string; description: string; items: { label: string; value: number; helper?: string }[] }) {
  return <Card className="min-w-0 rounded-xl shadow-xs"><CardHeader><CardTitle className="text-base">{title}</CardTitle><p className="text-sm text-muted-foreground">{description}</p></CardHeader><CardContent><dl className="divide-y">{items.map(item => <div key={item.label} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"><div><dt className="text-sm font-medium">{item.label}</dt>{item.helper && <dd className="mt-1 text-xs leading-5 text-muted-foreground">{item.helper}</dd>}</div><dd className="text-xl font-semibold tabular-nums">{item.value.toLocaleString()}</dd></div>)}</dl></CardContent></Card>
}

export default function DashboardPage() {
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    let active = true
    getBackendClient().send<OverviewData>("/api/overview", { method: "GET" })
      .then(result => { if (!result.success) throw new Error("Overview unavailable"); if (active) setData(result) })
      .catch(() => { if (active) setError(true) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [revision])

  return <div className="w-full min-w-0 space-y-6">
    <DashboardHeader title="Dashboard" description="Monitor your workspace, review outstanding work, and follow app usage." loading={loading} onRefresh={() => { setLoading(true); setError(false); setRevision(value => value + 1) }}>
      {(hasBackendPermission("analytics.read") || hasBackendPermission("admin.all")) && <Button variant="outline" asChild><Link href="/analytics/accounts"><BarChart3 className="size-4" aria-hidden="true" />Account analytics</Link></Button>}
    </DashboardHeader>
    {error ? <Alert variant="destructive"><AlertDescription>Unable to load the dashboard. Use Refresh to try again.</AlertDescription></Alert> : loading ? <DashboardLoading /> : data && <>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm"><h2 className="font-semibold">Workspace overview</h2><p className="text-xs text-muted-foreground">Snapshot from <time dateTime={data.cached_at}>{new Date(data.cached_at).toLocaleString("en-GB")}</time></p></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Registered users" value={data.metrics.totalUsers} helper={`${data.metrics.activeUsers.toLocaleString()} accounts with active status`} icon={Users} iconTone="text-blue-600 dark:text-blue-400" />
        <StatCard title="Healthcare providers" value={data.metrics.healthcareProviders} helper="Users assigned the healthcare provider role" icon={Hospital} iconTone="text-violet-600 dark:text-violet-400" />
        <StatCard title="Drug records" value={data.metrics.totalDrugs} helper={`${data.metrics.activeDrugs.toLocaleString()} with active status`} icon={ClipboardCheck} iconTone="text-emerald-600 dark:text-emerald-400" />
        <StatCard title="Health facilities" value={data.metrics.totalFacilities} helper="Facilities in the directory" icon={Building2} iconTone="text-cyan-600 dark:text-cyan-400" />
      </div>
      <section className="space-y-4" aria-labelledby="work-heading"><div><h2 id="work-heading" className="text-base font-semibold">Work to review</h2><p className="mt-1 text-sm text-muted-foreground">Current record statuses. Drug review groups can overlap.</p></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Users awaiting activation" value={data.pipeline.usersPendingActivation} helper="Pending account activation" icon={Users} iconTone="text-amber-600 dark:text-amber-400" />
        <StatCard title="Drugs under review" value={data.pipeline.drugsUnderReview} helper="Record status: under review" icon={AlertTriangle} iconTone="text-amber-600 dark:text-amber-400" />
        <StatCard title="Drugs pending review" value={data.pipeline.drugsPendingReview} helper="Review status: pending" icon={ClipboardCheck} iconTone="text-blue-600 dark:text-blue-400" />
        <StatCard title="Inactive drugs" value={data.pipeline.drugsInactive} helper="Record status: inactive" icon={Activity} />
      </div></section>
      <section className="space-y-4" aria-labelledby="activity-heading"><h2 id="activity-heading" className="text-base font-semibold">Growth & app usage</h2><div className="grid gap-4 xl:grid-cols-2"><OverviewSeriesChart users={data.series.usersByDay} drugs={data.series.drugsByDay} facilities={data.series.facilitiesByDay} /><OverviewEngagementChart engagement={data.engagement} /></div><OverviewFeatureUsageChart data={data.featureUsage ?? []} /></section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Content, support and coverage">
        <SummaryPanel title="Content library" description="Publication status across your knowledge base." items={[
          { label: "Clinical guidelines", value: data.contentHealth.medicalGuidelinesTotal, helper: `${data.contentHealth.medicalGuidelinesPublished.toLocaleString()} published · ${data.contentHealth.medicalGuidelinesDraft.toLocaleString()} without a published edition` },
          { label: "FAQs", value: data.contentHealth.faqsTotal, helper: `${data.contentHealth.faqsPublished.toLocaleString()} published · ${data.contentHealth.faqsDraft.toLocaleString()} draft` },
          { label: "Documentation", value: data.contentHealth.documentationTotal, helper: `${data.contentHealth.documentationPublished.toLocaleString()} published` },
          { label: "Clinical tools", value: data.contentHealth.calculatorsTotal, helper: `${data.contentHealth.calculatorsActive.toLocaleString()} active` },
        ]} />
        <SummaryPanel title="Support workload" description="Ticket statuses across the support desk." items={[
          { label: "Open", value: data.support.ticketsOpen }, { label: "In progress", value: data.support.ticketsInProgress },
          { label: "Resolved", value: data.support.ticketsResolved }, { label: "Closed", value: data.support.ticketsClosed },
          { label: "Urgent priority", value: data.support.ticketsUrgent, helper: "Across all ticket statuses" },
        ]} />
        <SummaryPanel title="Geographic directory" description="Administrative areas recorded in the directory." items={[
          { label: "Regions", value: data.coverage.regions }, { label: "Districts", value: data.coverage.districts },
          { label: "Subcounties", value: data.coverage.subcounties }, { label: "Parishes", value: data.coverage.parishes },
        ]} />
      </section>
    </>}
  </div>
}
