/**
 * Role Permissions Management Page
 * Dedicated page for managing role permissions with AccessControl integration
 */

"use client"

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Save, RotateCcw, AlertTriangle, ShieldCheck } from 'lucide-react'

import { UserSectionHeader, UserStatusBadge } from '@/components/users/user-section'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
// import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { PermissionBuilder } from '@/components/ui/permission-builder'
import { PermissionPreview } from '@/components/ui/permission-preview'
import { showToast } from '@/lib/toast'
import { useRolePermissionManagement } from '@/hooks/use-permissions'
import { usePermissionContext } from '@/lib/permission-context'

import type { RolesResponse } from '@/types/backend-types'
import { rolesService } from '@/services/user-management.service'
import type { RolePermissions, PermissionValidationResult } from '@/types/permissions'

export default function RolePermissionsPage() {
  const params = useParams()
  const router = useRouter()
  const roleId = params.id as string
  const { hasPermission, loading: permLoading } = usePermissionContext()

  React.useEffect(() => {
    if (permLoading) return
    if (!hasPermission("roles", "read:any")) {
      router.replace("/users/roles")
    }
  }, [permLoading, hasPermission, router])

  const canEdit = hasPermission("roles", "update:any")

  // Role data state
  const [role, setRole] = React.useState<RolesResponse | null>(null)
  const [roleLoading, setRoleLoading] = React.useState(true)
  const [roleError, setRoleError] = React.useState<string | null>(null)

  // Permission management
  const {
    rolePermissions,
    setRolePermissions,
    loadRolePermissions,
    updateRolePermissions,
    applyPermissionTemplate,
    validatePermissions,
    getEffectivePermissions,
    error: permissionError,
    initialized
  } = useRolePermissionManagement(roleId)

  const [draft, setDraft] = React.useState<{ roleId: string; permissions: RolePermissions } | null>(null)
  const editingPermissions = draft?.roleId === roleId ? draft.permissions : rolePermissions
  const hasUnsavedChanges = JSON.stringify(editingPermissions) !== JSON.stringify(rolePermissions)
  const validationResult = React.useMemo(() => validatePermissions(editingPermissions) as PermissionValidationResult, [editingPermissions, validatePermissions])
  const [saving, setSaving] = React.useState(false)

  // Load role data
  React.useEffect(() => {
    const loadRole = async () => {
      if (!roleId) return

      try {
        setRoleLoading(true)
        setRoleError(null)

        const roleData = await rolesService.get<RolesResponse>(roleId)
        setRole(roleData)

      } catch (error) {
        console.error('Failed to load role:', error)
        const errorMessage = error instanceof Error ? error.message : 'Failed to load role'
        setRoleError(errorMessage)
        showToast.error('Load Failed', errorMessage)
      } finally {
        setRoleLoading(false)
      }
    }

    loadRole()
  }, [roleId])

  const handlePermissionsChange = React.useCallback((permissions: RolePermissions) => {
    setDraft({ roleId, permissions })
  }, [roleId])

  // Handle template application
  const handleApplyTemplate = React.useCallback(async (templateKey: string) => {
    if (!canEdit || saving) return
    setSaving(true)
    try {
      const result = await applyPermissionTemplate(roleId, templateKey)
      if (result.success) {
        const next = await loadRolePermissions(roleId)
        if (next) { setRolePermissions(next); setDraft(null) }
      }
    } catch (error) {
      console.error('Failed to apply template:', error)
    } finally { setSaving(false) }
  }, [applyPermissionTemplate, roleId, canEdit, saving, loadRolePermissions, setRolePermissions])

  // Handle save
  const handleSave = React.useCallback(async () => {
    if (!canEdit || saving) return
    if (!validationResult?.isValid) {
      showToast.error('Validation Failed', 'Please fix validation errors before saving')
      return
    }

    try {
      setSaving(true)
      const result = await updateRolePermissions(roleId, editingPermissions)

      if (result.success) {
        setRolePermissions(editingPermissions)
        setDraft(null)
        showToast.success('Success', 'Role permissions updated successfully')
      }
    } catch (error) {
      console.error('Failed to save permissions:', error)
    } finally {
      setSaving(false)
    }
  }, [roleId, editingPermissions, updateRolePermissions, validationResult, canEdit, saving, setRolePermissions])

  // Handle reset
  const handleReset = React.useCallback(() => {
    if (rolePermissions) {
      setDraft(null)
    }
  }, [rolePermissions])

  // Preserve the unsaved-change check when leaving through the Back button.
  const handleNavigate = React.useCallback((href: string) => {
    if (!hasUnsavedChanges || window.confirm('You have unsaved changes. Are you sure you want to leave?')) router.push(href)
  }, [router, hasUnsavedChanges])
  const handleBack = React.useCallback(() => handleNavigate('/users/roles'), [handleNavigate])

  // Loading state
  if (!roleError && !permissionError && (roleLoading || !initialized)) {
    return (
      <div className="w-full min-w-0 space-y-6">
        <UserSectionHeader showNavigation={false} section="roles" icon={ShieldCheck} title="Role permissions" showBackButton onBack={handleBack} />
        <div role="status" aria-label="Loading role permissions" className="flex justify-between items-start">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-full max-w-96" />
          </div>
          <div className="flex space-x-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-28" />
          </div>
        </div>

        <div className="w-full min-w-0 space-y-6">
          <Card className="min-w-0 rounded-xl shadow-xs">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Error state
  if (roleError || permissionError) {
    return (
      <div className="w-full min-w-0 space-y-6">
        <UserSectionHeader showNavigation={false} section="roles" icon={ShieldCheck}
          title="Permission Management"
          description="Role permissions could not be loaded"
          showBackButton={true}
          onBack={handleBack}
        />

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {roleError || permissionError?.message || 'An unexpected error occurred'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // No role found
  if (!role) {
    return (
      <div className="w-full min-w-0 space-y-6">
        <UserSectionHeader showNavigation={false} section="roles" icon={ShieldCheck}
          title="Permission Management"
          description="Role not found"
          showBackButton={true}
          onBack={handleBack}
        />

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Role Not Found</AlertTitle>
          <AlertDescription>
            The requested role could not be found or you don&apos;t have permission to access it.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const effectivePermissions = role?.key ? getEffectivePermissions(role.key) : undefined

  return (
    <div className="w-full min-w-0 space-y-6">
      {/* Page Header */}
      <UserSectionHeader showNavigation={false} section="roles" icon={ShieldCheck}
        title={role.name}
        description="Configure resource access, review the proposed permissions, and save your changes."
        showBackButton={true}
        onBack={handleBack}
        actions={canEdit ? [
          {
            label: "Reset Changes",
            onClick: handleReset,
            variant: "outline",
            disabled: !hasUnsavedChanges || saving,
            icon: <RotateCcw className="h-4 w-4" />
          },
          {
            label: saving ? "Saving..." : "Save Changes",
            onClick: handleSave,
            disabled: !hasUnsavedChanges || saving || !validationResult?.isValid,
            icon: <Save className="h-4 w-4" />
          }
        ] : []}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/20 p-4"><div><h2 className="text-sm font-semibold">Role access configuration</h2><p className="mt-1 text-sm text-muted-foreground">{canEdit ? "Use the builder to edit access, then preview before saving." : "Read-only access. You can review this role’s configured permissions."}</p></div><Badge variant="outline">{saving ? "Saving…" : hasUnsavedChanges ? "Unsaved changes" : "No unsaved changes"}</Badge></div>

      {/* Unsaved Changes Warning */}
      {hasUnsavedChanges && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Unsaved Changes</AlertTitle>
          <AlertDescription>
            You have unsaved permission changes. Don&apos;t forget to save your work.
          </AlertDescription>
        </Alert>
      )}

      {/* Validation Errors */}
      {validationResult && !validationResult.isValid && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Validation Errors</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {validationResult.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Validation Warnings */}
      {validationResult && validationResult.warnings.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Warnings</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {validationResult.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Role Info Card */}
      <Card className="min-w-0 rounded-xl shadow-xs">
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center justify-between gap-3 text-base">
            <span>Role Information</span>
            <UserStatusBadge status={role.isActive ? "active" : "inactive"} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <strong>Role Key:</strong>
              <code className="ml-2 break-all rounded bg-muted px-2 py-1 text-xs">
                {role.key}
              </code>
            </div>
            <div>
              <strong>Created:</strong> {new Date(role.created).toLocaleDateString()}
            </div>
            <div>
              <strong>Updated:</strong> {new Date(role.updated).toLocaleDateString()}
            </div>
          </div>
          {role.description && (
            <div className="mt-2">
              <strong>Description:</strong> {role.description}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Permission Management Tabs */}
      <Tabs defaultValue="builder" className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-xl p-1.5">
          <TabsTrigger value="builder">Permission Builder</TabsTrigger>
          <TabsTrigger value="preview">Permission Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-4">
          <PermissionBuilder
            permissions={editingPermissions}
            onChange={handlePermissionsChange}
            disabled={saving || !canEdit}
            showTemplates={canEdit}
            onApplyTemplate={handleApplyTemplate}
          />
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <PermissionPreview
            permissions={editingPermissions}
            effectivePermissions={effectivePermissions}
            roleKey={role.key}
          />
        </TabsContent>
      </Tabs>

      <details className="rounded-xl border bg-muted/20"><summary className="cursor-pointer px-5 py-4 text-sm font-semibold">How permissions work</summary><div className="grid gap-4 border-t p-5 text-sm leading-6 text-muted-foreground md:grid-cols-2 xl:grid-cols-3">
          <p>
            <strong>Resources:</strong> System components like users, roles, content, etc. that can be accessed.
          </p>
          <p>
            <strong>Actions:</strong> What can be done with resources (create, read, update, delete).
          </p>
          <p>
            <strong>Own vs Any:</strong> &quot;Own&quot; means user can only access resources they created/own, &quot;Any&quot; means access to all resources of that type.
          </p>
          <p>
            <strong>Attributes:</strong> Fine-grained control over which fields can be accessed. Use &quot;*&quot; for all fields, &quot;!field&quot; to deny specific fields.
          </p>
          <p>
            <strong>Templates:</strong> Pre-configured permission sets for common roles. Templates save immediately and replace the configured permissions.
          </p>
        </div>
      </details>
    </div>
  )
}
