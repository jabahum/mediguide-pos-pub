"use client"

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { ShieldCheck, Plus } from "lucide-react"

import { UserSectionHeader } from "@/components/users/user-section"
import { BackendDataTable } from "@/components/ui/backend-data-table"
import { usePermissionContext } from "@/lib/permission-context"

// Page-specific imports
import { columns } from "./columns"
import { createRoleRowActions } from "./role-actions"
import { rolesAvailableFields } from "./fields"
import { Role, RoleModalStates, CreateRoleFormData, EditRoleFormData } from "./types"
import { useRoles } from "./hooks/use-roles"

// Modal components
import { CreateRoleModal } from "./modals/create-role-modal"
import { EditRoleModal } from "./modals/edit-role-modal"
import { rolesService } from "@/services/user-management.service"

export default function RolesPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const refreshTable = React.useCallback(() => queryClient.invalidateQueries({ queryKey: ["backend", "roles"] }), [queryClient])
  const { hasPermission, loading: permLoading } = usePermissionContext()

  React.useEffect(() => {
    if (permLoading) return
    if (!hasPermission("roles", "read:any")) {
      router.replace("/users")
    }
  }, [permLoading, hasPermission, router])

  // Role data and operations
  const {
    loading,
    createRole,
    updateRole,
    deleteRole,
    getRoleAssignmentInfo,
  } = useRoles()

  // Modal states
  const [modalStates, setModalStates] = React.useState<RoleModalStates>({
    createOpen: false,
    editOpen: false,
    deleteOpen: false,
    selectedRole: null,
  })

  // Modal handlers
  const handleCreateRole = React.useCallback(() => {
    setModalStates(prev => ({ ...prev, createOpen: true }))
  }, [])

  const handleEditRole = React.useCallback((role: Role) => {
    setModalStates(prev => ({
      ...prev,
      editOpen: true,
      selectedRole: role,
    }))
  }, [])

  const handleDeleteRole = React.useCallback(async (role: Role) => {
    try {
      // Check if role can be deleted
      const assignmentInfo = await getRoleAssignmentInfo(role.id)
      
      if (!assignmentInfo.canDelete) {
        // Show warning - in a real app, you might show a confirmation dialog
        // with the list of affected users
        return
      }

      const result = await deleteRole(role.id)
      if (result.success) await refreshTable()
    } catch (error) {
      console.error('Failed to delete role:', error)
    }
  }, [deleteRole, getRoleAssignmentInfo, refreshTable])

  const handleToggleStatus = React.useCallback(async (role: Role) => {
    try {
      const result = await updateRole(role.id, {
        description: role.description,
        isActive: !role.isActive,
      })
      if (result.success) await refreshTable()
    } catch (error) {
      console.error('Failed to toggle role status:', error)
    }
  }, [updateRole, refreshTable])

  const handleManagePermissions = React.useCallback((role: Role) => {
    router.push(`/users/roles/${role.id}/permissions`)
  }, [router])

  // Form submission handlers
  const handleCreateSubmit = React.useCallback(async (data: CreateRoleFormData & { key: string }) => {
    const result = await createRole(data)
    if (!result.success) throw new Error(result.message || "The role could not be saved")
    await refreshTable()
    if (result.success) {
      setModalStates(prev => ({ ...prev, createOpen: false }))
    }
  }, [createRole, refreshTable])

  const handleEditSubmit = React.useCallback(async (id: string, data: EditRoleFormData) => {
    const result = await updateRole(id, data)
    if (!result.success) throw new Error(result.message || "The role could not be saved")
    await refreshTable()
    if (result.success) {
      setModalStates(prev => ({
        ...prev,
        editOpen: false,
        selectedRole: null,
      }))
    }
  }, [updateRole, refreshTable])

  // Create row actions with handlers
  const roleRowActions = React.useMemo(() => 
    createRoleRowActions({
      onEdit: handleEditRole,
      onDelete: handleDeleteRole,
      onToggleStatus: handleToggleStatus,
      onManagePermissions: handleManagePermissions,
    }), 
    [handleEditRole, handleDeleteRole, handleToggleStatus, handleManagePermissions]
  )


  return (
    <div className="w-full min-w-0 space-y-6">
      {/* Page Header */}
      <UserSectionHeader section="roles" icon={ShieldCheck}
        title="Roles & Permissions"
        description="Organize access roles, review their status, and configure what each role can do."
        actions={hasPermission("roles", "create:any") ? [
          {
            label: "Add Role",
            onClick: handleCreateRole,
            icon: <Plus className="h-4 w-4" />
          },
        ] : []}
      />

      {/* Simplified DataTable */}
      <BackendDataTable<Role>
        collection="roles"
        loadPage={async ({ page, perPage, search }) => {
          const result = await rolesService.list<Role>({ page, per_page: perPage, search })
          return { items: result.items, page: result.page, perPage: result.per_page, totalItems: result.total_items, totalPages: result.total_pages }
        }}
        columns={columns}
        searchFields={["name", "key"]}
        searchPlaceholder="Search role name or key…"
        rowActions={roleRowActions}
        bulkActions={[]} // No bulk actions for roles
        availableFields={rolesAvailableFields}
        ui={{
          appearance: "workspace",
          title: "Role library",
          searchLabel: "Search roles",
          pageSize: 10,
          exportable: true,
        }}
        onError={(error) => console.error('Roles table error:', error)}
      />

      {/* Create Role Modal */}
      <CreateRoleModal
        open={modalStates.createOpen}
        onOpenChange={(open) => 
          setModalStates(prev => ({ ...prev, createOpen: open }))
        }
        onSubmit={handleCreateSubmit}
        loading={loading.operation}
      />

      {/* Edit Role Modal */}
      <EditRoleModal
        open={modalStates.editOpen}
        onOpenChange={(open) => 
          setModalStates(prev => ({ 
            ...prev, 
            editOpen: open,
            selectedRole: open ? prev.selectedRole : null
          }))
        }
        role={modalStates.selectedRole}
        onSubmit={handleEditSubmit}
        loading={loading.operation}
      />
    </div>
  )
}
