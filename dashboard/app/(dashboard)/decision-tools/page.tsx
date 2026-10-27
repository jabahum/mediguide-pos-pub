"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { useDashboardRouter as useRouter } from "@/components/dialogs/create-dialog-context"
import Link from "next/link"
import { Plus } from "lucide-react"

// Components
import { ToolSectionHeader } from "@/components/clinical-tools/tool-section"
import { BackendDataTable } from "@/components/ui/backend-data-table"

// Page-specific imports
import { columns, DecisionToolWithRelations } from "./columns"
import { createDecisionToolRowActions, decisionToolBulkActions } from "./decision-tool-actions"
import { decisionToolsAvailableFields } from "./fields"
import { usePermissionContext } from "@/lib/permission-context"
import { calculatorService } from "@/services/calculator.service"

export default function DecisionToolsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const typeFilter = searchParams.get("type")

  const { hasPermission, loading } = usePermissionContext()

  React.useEffect(() => {
    if (loading) return
    if (!hasPermission("content", "read:any")) {
      router.replace("/")
    }
  }, [loading, hasPermission, router])

  // Create row actions with navigation dependency injection
  const decisionToolRowActions = React.useMemo(() =>
    createDecisionToolRowActions((path) => router.push(path)),
    [router]
  )

  const loadPage = React.useCallback(
    (query: Parameters<typeof calculatorService.listTable>[0]) =>
      calculatorService.listTable(query, typeFilter || undefined),
    [typeFilter],
  )

  return (
    <div className="w-full min-w-0 space-y-6">
      {/* Page Header */}
      <ToolSectionHeader
        title="Decision tools"
        description="Find tools, manage their definitions, and follow each version through clinical review."
        actions={hasPermission("content", "create:any") ? [
          {
            label: "Add Decision Tool",
            onClick: () => router.push(typeFilter ? `/decision-tools/create?type=${typeFilter}` : '/decision-tools/create'),
            icon: <Plus className="h-4 w-4" />
          }
        ] : []}
      />

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter tools by type">
        {[{ label: "All tools", value: "" }, { label: "Calculators", value: "calculator" }, { label: "Decision tools", value: "decision_tool" }, { label: "Checklists", value: "checklist" }].map(item => <Link key={item.value} href={item.value ? `/decision-tools?type=${item.value}` : "/decision-tools"} aria-current={(typeFilter || "") === item.value ? "page" : undefined} className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${(typeFilter || "") === item.value ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground"}`}>{item.label}</Link>)}
      </div>
      {/* Tool library */}
      <BackendDataTable<DecisionToolWithRelations>
        key={typeFilter ?? "all"}
        collection="calculators"
        queryScope={typeFilter || "all"}
        loadPage={loadPage}
        columns={columns}
        searchPlaceholder="Search tool name, description, type, or version…"
        searchFields={["name", "description", "type", "version"]}
        rowActions={decisionToolRowActions}
        bulkActions={decisionToolBulkActions}
        availableFields={decisionToolsAvailableFields}
        ui={{
          appearance: "workspace",
          searchLabel: "Search tools",
          title: "Tool library",
          exportable: true
        }}
      />
    </div>
  )
}
