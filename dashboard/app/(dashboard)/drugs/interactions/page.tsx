'use client'

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DrugSectionHeader } from "@/components/drugs/drug-section"
import { EmptyState } from "@/components/ui/empty-state"
import { cn, formatStatus } from "@/lib/utils"
import { interactionExamples as interactions, interactionCsv } from "./interaction-examples"
import {
  AlertTriangle,
  Search,
  Pill,
  Shield,
  Info,
  Download,
  X
} from "lucide-react"
import { useState } from "react"
import * as React from "react"
import { useRouter } from "next/navigation"
import { usePermissionContext } from "@/lib/permission-context"



const severityLevels = ["all", "major", "moderate", "minor"]
const evidenceLevels = ["all", "well-established", "probable", "possible"]

export default function DrugInteractionsPage() {
  const router = useRouter()
  const { hasPermission, loading } = usePermissionContext()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSeverity, setSelectedSeverity] = useState("all")
  const [selectedEvidence, setSelectedEvidence] = useState("all")

  React.useEffect(() => {
    if (loading) return
    if (!hasPermission("content", "read:any")) {
      router.replace("/drugs")
    }
  }, [loading, hasPermission, router])

  const filteredInteractions = interactions.filter(interaction => {
    const matchesSearch =
      interaction.drug1.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
      interaction.drug2.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
      interaction.clinicalEffect.toLowerCase().includes(searchTerm.trim().toLowerCase())
    const matchesSeverity = selectedSeverity === "all" || interaction.severity === selectedSeverity
    const matchesEvidence = selectedEvidence === "all" || interaction.evidence === selectedEvidence
    return matchesSearch && matchesSeverity && matchesEvidence
  })

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "major": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "moderate": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
      case "minor": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "major": return <AlertTriangle className="h-4 w-4 text-red-600" />
      case "moderate": return <Shield className="h-4 w-4 text-orange-600" />
      case "minor": return <Info className="h-4 w-4 text-yellow-600" />
      default: return <Info className="h-4 w-4 text-gray-600" />
    }
  }

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case "common": return "text-red-600 dark:text-red-400"
      case "frequent": return "text-orange-600 dark:text-orange-400"
      case "occasional": return "text-blue-600 dark:text-blue-400"
      case "rare": return "text-gray-600 dark:text-gray-400"
      default: return "text-gray-600 dark:text-gray-400"
    }
  }

  const hasFilters = Boolean(searchTerm.trim() || selectedSeverity !== "all" || selectedEvidence !== "all");
  const clearFilters = () => { setSearchTerm(""); setSelectedSeverity("all"); setSelectedEvidence("all"); };
  const exportExamples = () => {
    const url = URL.createObjectURL(new Blob([interactionCsv(filteredInteractions)], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "example-drug-interactions.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };
  const overview = [
    { label: "All examples", count: interactions.length, icon: Pill, active: selectedSeverity === "all" && selectedEvidence === "all", onClick: () => { setSelectedSeverity("all"); setSelectedEvidence("all"); }, color: "bg-primary/10 text-primary" },
    { label: "Major", count: interactions.filter((item) => item.severity === "major").length, icon: AlertTriangle, active: selectedSeverity === "major", onClick: () => setSelectedSeverity("major"), color: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300" },
    { label: "Moderate", count: interactions.filter((item) => item.severity === "moderate").length, icon: Shield, active: selectedSeverity === "moderate", onClick: () => setSelectedSeverity("moderate"), color: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" },
    { label: "Well-established evidence", count: interactions.filter((item) => item.evidence === "well-established").length, icon: Info, active: selectedEvidence === "well-established", onClick: () => setSelectedEvidence("well-established"), color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  ];

  return <div className="w-full min-w-0 space-y-6">
    <DrugSectionHeader icon={Shield} title="Drug interactions" description="Browse and filter the example interaction library." actions={[{ label: "Export examples", variant: "outline", icon: <Download className="size-4" />, onClick: exportExamples, disabled: !filteredInteractions.length }]} />
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-blue-200 bg-blue-50/60 px-4 py-3 text-sm dark:border-blue-900 dark:bg-blue-950/30"><Badge variant="outline" className="border-blue-200 text-blue-800 dark:border-blue-800 dark:text-blue-300">Example data</Badge><p className="text-muted-foreground">The entries in this view are demonstration content.</p></div>
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Example library overview">{overview.map(({ label, count, icon: Icon, active, onClick, color }) => <button key={label} type="button" aria-label={`${count} ${label}`} aria-pressed={active} onClick={onClick} className={cn("flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-5", active && "border-primary/40 bg-primary/[0.025]")}><span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", color)}><Icon className="size-5" aria-hidden="true" /></span><span className="min-w-0"><span className="block text-2xl font-semibold tabular-nums">{count}</span><span className="block text-xs leading-5 text-muted-foreground sm:text-sm">{label}</span></span></button>)}</div>
    <section aria-label="Filter interactions" className="rounded-xl border bg-card p-4 shadow-xs sm:p-5">
      <div className="grid items-end gap-4 md:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr]">
        <div className="space-y-2 md:col-span-2 xl:col-span-1"><label htmlFor="interaction-search" className="text-xs font-medium">Search interactions</label><div className="relative"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" /><Input id="interaction-search" type="search" className="h-10 rounded-lg pl-9" placeholder="Search drug names or clinical effects…" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} /></div></div>
        <div className="space-y-2"><label htmlFor="interaction-severity" className="text-xs font-medium">Severity</label><Select value={selectedSeverity} onValueChange={setSelectedSeverity}><SelectTrigger id="interaction-severity" className="h-10! w-full rounded-lg"><SelectValue /></SelectTrigger><SelectContent>{severityLevels.map((level) => <SelectItem key={level} value={level}>{level === "all" ? "All severities" : formatStatus(level)}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-2"><label htmlFor="interaction-evidence" className="text-xs font-medium">Evidence</label><Select value={selectedEvidence} onValueChange={setSelectedEvidence}><SelectTrigger id="interaction-evidence" className="h-10! w-full rounded-lg"><SelectValue /></SelectTrigger><SelectContent>{evidenceLevels.map((level) => <SelectItem key={level} value={level}>{level === "all" ? "All evidence levels" : formatStatus(level.replace(/-/g, "_"))}</SelectItem>)}</SelectContent></Select></div>
      </div>
      {hasFilters && <div className="mt-4 flex justify-end border-t pt-3"><Button variant="ghost" size="sm" onClick={clearFilters}><X className="mr-1.5 size-3.5" aria-hidden="true" />Clear filters</Button></div>}
    </section>
    <p role="status" aria-live="polite" className="text-sm text-muted-foreground"><span className="font-medium text-foreground">{filteredInteractions.length} {filteredInteractions.length === 1 ? "example" : "examples"}</span> match your selection</p>
    <div className="grid gap-4 xl:grid-cols-2">{filteredInteractions.map((interaction) => <Card key={interaction.id} className="min-w-0 rounded-xl shadow-xs">
      <CardHeader className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-2"><Badge className={cn("gap-1.5 rounded-full border-transparent", getSeverityColor(interaction.severity))}>{getSeverityIcon(interaction.severity)}{formatStatus(interaction.severity)}</Badge><span className="text-xs text-muted-foreground">Frequency: <span className={getFrequencyColor(interaction.frequency)}>{formatStatus(interaction.frequency)}</span></span></div><h2 className="break-words text-lg font-semibold leading-7">{interaction.drug1} + {interaction.drug2}</h2><p className="text-sm leading-6 text-muted-foreground">{interaction.clinicalEffect}</p></CardHeader>
      <CardContent className="space-y-4"><dl className="grid gap-4 border-t pt-4 sm:grid-cols-2"><div><dt className="mb-1 text-xs font-medium text-muted-foreground">Mechanism</dt><dd className="text-sm leading-6">{interaction.mechanism}</dd></div><div><dt className="mb-1 text-xs font-medium text-muted-foreground">Evidence level</dt><dd className="text-sm leading-6">{formatStatus(interaction.evidence.replace(/-/g, "_"))}</dd></div></dl><Alert className="border-primary/10 bg-muted/30"><Info className="size-4" aria-hidden="true" /><AlertDescription><strong>Management:</strong> {interaction.management}</AlertDescription></Alert></CardContent>
    </Card>)}</div>
    {!filteredInteractions.length && <div className="rounded-xl border border-dashed"><EmptyState icon={Pill} title="No matching interaction examples" description="Try another drug name or clear your filters to see every example." action={{ label: "Clear filters", onClick: clearFilters }} /></div>}
  </div>;
}
