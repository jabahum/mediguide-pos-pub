"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowLeft, BarChart3, KeyRound, Mail, UserRoundCheck, type LucideIcon } from "lucide-react"
import { getBackendClient } from "@/lib/backend-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DashboardHeader, DashboardLoading } from "@/components/dashboard/dashboard-header"
import { formatStatus } from "@/lib/utils"

type Summary = {
  since: string
  events: { event: string; count: number }[]
  email_queue: { status: string; count: number }[]
}

const labels: Record<string, string> = {
  "user.account_created": "Accounts created",
  "user.password_reset_requested": "Reset links requested",
  "user.password_reset_completed": "Passwords reset",
  "user.email_verification_requested": "Verification links requested",
  "user.email_verified": "Emails verified",
  "user.verified": "Accounts approved by administrators",
  "user.account_email_sent": "Emails accepted by provider",
  "user.account_email_send_failed": "Email send attempts failed",
  "user.account_email_failed": "Emails exhausted retries",
  "user.account_email_cancelled": "Expired or superseded emails cancelled",
}

const groups: { title: string; description: string; icon: LucideIcon; events: string[] }[] = [
  { title: "Registration & verification", description: "Account creation, verification and administrator approvals.", icon: UserRoundCheck, events: ["user.account_created", "user.email_verification_requested", "user.email_verified", "user.verified"] },
  { title: "Password recovery", description: "Reset requests and completed password resets.", icon: KeyRound, events: ["user.password_reset_requested", "user.password_reset_completed"] },
  { title: "Account email activity", description: "Provider acceptance, failed attempts and expired messages.", icon: Mail, events: ["user.account_email_sent", "user.account_email_send_failed", "user.account_email_failed", "user.account_email_cancelled"] },
]

export default function AccountAnalyticsPage() {
  const [data, setData] = useState<Summary | null>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [reload, setReload] = useState(0)
  const [days, setDays] = useState(30)

  useEffect(() => {
    let active = true
    getBackendClient().send<Summary>("/api/v2/analytics/accounts", { query: { days } })
      .then(result => { if (active) setData(result) })
      .catch(() => { if (active) setError(true) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [reload, days])

  return <div className="w-full min-w-0 space-y-6">
    <DashboardHeader title="Account analytics" description="Follow registration, verification, password recovery, and account email activity." icon={BarChart3} loading={loading} onRefresh={() => { setLoading(true); setError(false); setReload(value => value + 1) }}>
      <Button asChild variant="outline"><Link href="/"><ArrowLeft className="size-4" aria-hidden="true" />Dashboard</Link></Button>
    </DashboardHeader>
    <div className="flex flex-col gap-4 rounded-xl border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div><h2 className="text-sm font-semibold">Account lifecycle events</h2><p className="mt-1 text-sm text-muted-foreground">Event counts for the selected period; a person can generate multiple events.</p></div>
      <label className="flex shrink-0 items-center gap-3 text-sm font-medium">Event period<select className="h-10 rounded-lg border bg-background px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={days} onChange={event => { setLoading(true); setError(false); setDays(Number(event.target.value)) }}>{[7, 30, 90].map(value => <option key={value} value={value}>Last {value} days</option>)}</select></label>
    </div>
    {error ? <Alert variant="destructive"><AlertDescription>Unable to load account analytics. Check your permissions and try again.</AlertDescription></Alert> : loading ? <DashboardLoading /> : data && <>
      <p className="text-xs text-muted-foreground">Events since <time dateTime={data.since}>{new Date(data.since).toLocaleString("en-GB")}</time></p>
      <div className="grid gap-4 xl:grid-cols-3">{groups.map(({ title, description, icon: Icon, events }) => <Card key={title} className="min-w-0 rounded-xl shadow-xs"><CardHeader><div className="mb-2 flex items-center gap-3"><span className="rounded-xl bg-primary/5 p-2.5 text-primary"><Icon className="size-5" aria-hidden="true" /></span><CardTitle className="text-base">{title}</CardTitle></div><p className="text-sm leading-6 text-muted-foreground">{description}</p></CardHeader><CardContent><dl className="divide-y">{events.map((key, index) => <div key={key} className={index === 0 ? "pb-5" : "flex items-start justify-between gap-4 py-3 last:pb-0"}><dt className="text-sm text-muted-foreground">{labels[key]}</dt><dd className={index === 0 ? "mt-2 text-4xl font-semibold tracking-tight tabular-nums" : "text-lg font-semibold tabular-nums"}>{(data.events.find(event => event.event === key)?.count ?? 0).toLocaleString()}</dd></div>)}</dl></CardContent></Card>)}</div>
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="min-w-0 rounded-xl shadow-xs xl:col-span-2"><CardHeader><CardTitle className="text-base">Email delivery records</CardTitle><p className="text-sm leading-6 text-muted-foreground">Current status of all recorded account emails, across all time. This section is independent of the event period.</p></CardHeader><CardContent>{data.email_queue.length ? <div className="overflow-x-auto"><table className="w-full text-sm"><caption className="sr-only">All recorded account emails by current status</caption><thead><tr className="border-b text-left text-xs text-muted-foreground"><th scope="col" className="pb-3 font-medium">Status</th><th scope="col" className="pb-3 text-right font-medium">Records</th></tr></thead><tbody>{data.email_queue.map(delivery => <tr key={delivery.status} className="border-b last:border-0"><th scope="row" className="py-3 text-left font-medium">{delivery.status === "sent" ? "Accepted by provider" : formatStatus(delivery.status)}</th><td className="py-3 text-right font-semibold tabular-nums">{delivery.count.toLocaleString()}</td></tr>)}</tbody></table></div> : <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-8 text-center"><Mail className="mx-auto mb-3 size-6 text-muted-foreground" aria-hidden="true" /><p className="text-sm text-muted-foreground">No account emails have been queued yet.</p></div>}</CardContent></Card>
        <aside className="rounded-xl border bg-muted/20 p-5"><h2 className="text-sm font-semibold">Reading these numbers</h2><div className="mt-3 space-y-3 text-sm leading-6 text-muted-foreground"><p>Provider acceptance does not confirm inbox delivery.</p><p>Counts cover events recorded after lifecycle tracking was enabled; older accounts are not counted as new registrations.</p><p>Requests, retries and completions are separate events. These counts do not represent a conversion or delivery success rate.</p></div></aside>
      </div>
    </>}
  </div>
}
