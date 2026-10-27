"use client"

import * as React from "react"
import { useDashboardRouter as useRouter } from "@/components/dialogs/create-dialog-context"
import { Plus } from "lucide-react"

import { UserSectionHeader } from "@/components/users/user-section"
import { BackendDataTable } from "@/components/ui/backend-data-table"
import { usePermissionContext } from "@/lib/permission-context"
import { createColumns, User } from "./columns"
import { createUserRowActions, userBulkActions } from "./user-actions"
import { createUsersAvailableFields } from "./fields"
import { useRoleOptions } from "@/hooks/use-roles-options"
import { usersService } from "@/services/user-management.service"

export default function UsersPage() {
  const router = useRouter()
  const { hasPermission, loading } = usePermissionContext()
  const { roleOptions } = useRoleOptions()

  React.useEffect(() => {
    if (loading) return
    if (!hasPermission("users", "read:any")) {
      router.replace("/")
    }
  }, [loading, hasPermission, router])
  
  // Create columns with dynamic roles
  const columns = React.useMemo(() => createColumns(roleOptions), [roleOptions])
  
  // Create available fields with dynamic roles
  const usersAvailableFields = React.useMemo(() => createUsersAvailableFields(), [])

  // Create row actions with proper navigation
  const userRowActions = React.useMemo(() => 
    createUserRowActions((path) => router.push(path)), 
    [router]
  )

  const handleError = React.useCallback((error: Error) => {
    console.error('Users table error:', error)
  }, [])

  return (
    <div className="w-full min-w-0 space-y-6">
      <UserSectionHeader
        title="User management"
        description="Find people, review account status, and manage their access to MediGuide."
        actions={hasPermission("users", "create:any") ? [
          {
            label: "Add User",
            onClick: () => router.push('/users/create'),
            icon: <Plus className="h-4 w-4" />
          },
        ] : []}
      />

      {/* Simplified DataTable */}
      <BackendDataTable<User>
        collection="users"
        loadPage={async ({ page, perPage, search, filters }) => {
          const status = filters.find((item) => item.field === "status" && item.condition === "equals")?.value
          const roleId = filters.find((item) => item.field === "role_id" && item.condition === "equals")?.value
          const result = await usersService.list<User>({ page, per_page: perPage, search, status: status ? String(status) : undefined, role_id: roleId ? String(roleId) : undefined, sort: "created_at", order: "desc" })
          return { items: result.items, page: result.page, perPage: result.per_page, totalItems: result.total_items, totalPages: result.total_pages }
        }}
        columns={columns}
        searchFields={["name", "email", "phone"]}
        searchPlaceholder="Search name, email, or phone…"
        rowActions={userRowActions}
        bulkActions={userBulkActions}
        availableFields={usersAvailableFields}
        ui={{
          appearance: "workspace",
          title: "User directory",
          searchLabel: "Search users",
          pageSize: 20,
          exportable: true,
          importable: true,
        }}
        onError={handleError}
      />
    </div>
  )
}
