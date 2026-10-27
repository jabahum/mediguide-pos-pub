"use client"

import * as React from "react"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { usePermissionContext } from "@/lib/permission-context"

import { FacilitySectionHeader } from "@/components/facilities/facility-section"
import { EnhancedBackendDataTable } from "@/components/ui/enhanced-backend-data-table"
import { RegionsResponse } from "@/types/backend-types"

import { regionsColumns } from "./columns"
import { regionsAvailableFields } from "./fields"
import { AdminEntityModal, AdminFieldDef } from "../_lib/admin-entity-modal"
import { createAdminRowActions, createAdminBulkActions } from "../_lib/admin-crud-actions"
import { healthFacilitiesService } from "@/services/health-facilities.service"

const FIELDS: AdminFieldDef[] = [
  { name: "name", label: "Name", type: "text", placeholder: "Enter region name" },
  { name: "nhpi_code", label: "NHPI Code", type: "text", placeholder: "e.g., REG001", span: "half" },
  { name: "hsdt_code", label: "HSDT Code", type: "text", placeholder: "e.g., R/001", span: "half" },
]

export default function RegionsPage() {
  const [modalOpen, setModalOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<RegionsResponse | null>(null)

  const openCreate = React.useCallback(() => {
    setEditing(null)
    setModalOpen(true)
  }, [])

  const openEdit = React.useCallback((row: RegionsResponse) => {
    setEditing(row)
    setModalOpen(true)
  }, [])

  const closeModal = React.useCallback(() => {
    setModalOpen(false)
    setEditing(null)
  }, [])

  const rowActions = React.useMemo(
    () =>
      createAdminRowActions<RegionsResponse>({
        deleteRecord: healthFacilitiesService.deleteRegion,
        entityLabel: "Region",
        getDisplayName: (row) => row.name,
        onEdit: openEdit,
      }),
    [openEdit]
  )

  const bulkActions = React.useMemo(
    () =>
      createAdminBulkActions<RegionsResponse>({
        deleteRecord: healthFacilitiesService.deleteRegion,
        entityLabel: "Region",
        entityLabelPlural: "Regions",
      }),
    []
  )
  const router = useRouter()
  const { hasPermission, loading } = usePermissionContext()

  React.useEffect(() => {
    if (loading) return
    if (!hasPermission("content", "read:any")) {
      router.replace("/health-facilities")
    }
  }, [loading, hasPermission, router])

  return (
    <div className="w-full min-w-0 space-y-6">
      <FacilitySectionHeader section="regions"
        title="Regions"
        description="Manage administrative regions in the health system"
        actions={hasPermission("content", "create:any") ? [
          {
            label: "Add Region",
            onClick: openCreate,
            icon: <Plus className="h-4 w-4" />,
          },
        ] : []}
      />

      <EnhancedBackendDataTable<RegionsResponse>
        collectionName="regions"
        loadPage={healthFacilitiesService.listRegions}
        appearance="workspace"
        searchLabel="Search regions"
        title="Regions library"
        columns={regionsColumns}
        searchable={true}
        searchFields={["name", "nhpi_code", "hsdt_code"]}
        selectable={true}
        exportable={true}
        availableFields={regionsAvailableFields}
        rowActions={rowActions.filter(action => hasPermission("content", action.id === "edit" ? "update:any" : "delete:any"))}
        bulkActions={hasPermission("content", "delete:any") ? bulkActions : []}
        persistColumnConfig={true}
        tableContext="regions-management"
      />

      <AdminEntityModal collection="regions"
        open={modalOpen}
        onClose={closeModal}
        createRecord={healthFacilitiesService.createRegion}
        updateRecord={healthFacilitiesService.updateRegion}
        entityLabel="Region"
        fields={FIELDS}
        record={editing}
      />
    </div>
  )
}
