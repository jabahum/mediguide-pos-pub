"use client"

import { useQuery } from "@tanstack/react-query"
import { hasBackendPermission } from "@/lib/backend-client"
import { calculatorService } from "@/services/calculator.service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function ToolUsage({ toolId }: { toolId: string }) {
  const allowed = hasBackendPermission("analytics.read") || hasBackendPermission("admin.all")
  const query = useQuery({
    queryKey: ["backend", "calculators", toolId, "usage"],
    queryFn: () => calculatorService.usage(toolId),
    enabled: allowed,
    staleTime: 60_000,
  })

  if (!allowed) return <p className="text-sm text-muted-foreground">Analytics permission is required to view tool usage.</p>

  const data = query.data
  const maximum = Math.max(1, ...(data?.daily ?? []).map(day => day.sessions ?? 0))
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Usage Statistics</h2>
          <p className="text-sm text-muted-foreground">Synced sessions for this tool across all published versions.</p>
        </div>
        <Button variant="outline" onClick={() => void query.refetch()} disabled={query.isFetching}>Refresh</Button>
      </div>
      {query.isPending && <p role="status">Loading tool usage…</p>}
      {query.isError && <Alert variant="destructive"><AlertDescription>Unable to load tool usage. Try refreshing.</AlertDescription></Alert>}
      {!query.isError && data && <>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Total sessions", data.total_sessions ?? 0],
            ["Distinct users", data.unique_users ?? 0],
            ["Ended sessions", data.ended_sessions ?? 0],
            ["Sessions in last 30 days", data.recent_sessions ?? 0],
          ].map(([label, value]) => <Card key={label}>
            <CardHeader><CardTitle className="text-sm font-medium">{label}</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-semibold tabular-nums">{value.toLocaleString()}</p></CardContent>
          </Card>)}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Daily sessions</CardTitle>
            <CardDescription>{data.since} to {data.until} · UTC</CardDescription>
          </CardHeader>
          <CardContent>
            {data.total_sessions === 0 && <p className="mb-4 text-sm text-muted-foreground">No synced usage sessions have been recorded for this tool yet.</p>}
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">Tool sessions by UTC date over the last 30 days</caption>
                <thead><tr className="border-b text-left"><th className="py-2 font-medium">Date (UTC)</th><th className="py-2 text-right font-medium">Sessions</th><th aria-label="Relative usage" className="w-1/2" /></tr></thead>
                <tbody>{[...(data.daily ?? [])].reverse().map(day => <tr key={day.date} className="border-b last:border-0">
                  <td className="py-2">{day.date}</td>
                  <td className="py-2 text-right tabular-nums">{day.sessions ?? 0}</td>
                  <td className="pl-4" aria-hidden="true"><div className="h-2 rounded bg-primary/70" style={{ width: `${((day.sessions ?? 0) / maximum) * 100}%` }} /></td>
                </tr>)}</tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </>}
      <p className="text-sm text-muted-foreground">
        A session starts when a signed-in user opens the mobile tool. An ended session means the tool page closed, not that an assessment was completed.
        Offline sessions appear after synchronization. Dashboard test runs and guest usage are not counted. Inputs and clinical results are not collected by this tracking.
      </p>
    </div>
  )
}
