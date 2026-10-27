/**
 * Permission Preview Component
 * Shows effective permissions in a human-readable format
 */

"use client"

import * as React from 'react'
import { Shield, Check, X, Eye, Edit, Plus, Trash, Lock } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import { Separator } from '@/components/ui/separator'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import type {
  RolePermissions,
  EffectivePermissions,
  PermissionAction
} from '@/types/permissions'
import {
  SYSTEM_RESOURCES,
  PERMISSION_ACTIONS
  // ACTION_GROUPS
} from '@/types/permissions'

interface PermissionPreviewProps {
  permissions: RolePermissions
  effectivePermissions?: EffectivePermissions
  roleKey?: string
  className?: string
}

interface ResourcePermissionSummaryProps {
  resourceKey: string
  resourceName: string
  permissions: RolePermissions[string]
  effective?: EffectivePermissions[string]
}

interface ActionIconProps {
  action: PermissionAction
  className?: string
}

/**
 * Main Permission Preview Component
 */
export function PermissionPreview({
  permissions,
  effectivePermissions,
  roleKey,
  className
}: PermissionPreviewProps) {
  const resourcesWithPermissions = Object.keys(permissions).filter(
    resourceKey => Object.keys(permissions[resourceKey] || {}).length > 0
  )

  const totalPermissions = resourcesWithPermissions.reduce(
    (count, resourceKey) => count + Object.keys(permissions[resourceKey] || {}).length,
    0
  )

  if (totalPermissions === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Lock className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No permissions configured</p>
          <p className="text-sm text-muted-foreground">
            This role has no access to any system resources.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={className}>
      {/* Summary Header */}
      <Card className="mb-4 min-w-0 rounded-xl shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permission Summary
            {roleKey && (
              <Badge variant="outline" className="ml-auto">
                {roleKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{resourcesWithPermissions.length}</div>
              <div className="text-sm text-muted-foreground">Resources</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{totalPermissions}</div>
              <div className="text-sm text-muted-foreground">Permissions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {Object.values(permissions).reduce((count, resource) => 
                  count + Object.keys(resource || {}).filter(action => action.includes('read')).length, 0
                )}
              </div>
              <div className="text-sm text-muted-foreground">Read Access</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {Object.values(permissions).reduce((count, resource) => 
                  count + Object.keys(resource || {}).filter(action => 
                    action.includes('create') || action.includes('update') || action.includes('delete')
                  ).length, 0
                )}
              </div>
              <div className="text-sm text-muted-foreground">Write Access</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Permissions */}
      <Card className="min-w-0 rounded-xl shadow-xs">
        <CardHeader>
          <CardTitle>Detailed Permissions</CardTitle>
          <p className="text-sm text-muted-foreground">
            Breakdown of permissions by resource and action
          </p>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {resourcesWithPermissions.map((resourceKey) => (
              <AccordionItem key={resourceKey} value={resourceKey}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <span>{SYSTEM_RESOURCES[resourceKey]?.name || resourceKey}</span>
                    </div>
                    <Badge variant="secondary" className="ml-auto mr-2">
                      {Object.keys(permissions[resourceKey] || {}).length} permissions
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ResourcePermissionSummary
                    resourceKey={resourceKey}
                    resourceName={SYSTEM_RESOURCES[resourceKey]?.name || resourceKey}
                    permissions={permissions[resourceKey] || {}}
                    effective={effectivePermissions?.[resourceKey]}
                  />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Resource Permission Summary
 */
function ResourcePermissionSummary({
  resourceKey: _resourceKey,
  resourceName: _resourceName,
  permissions,
  effective
}: ResourcePermissionSummaryProps) {
  // Unused parameters for future implementation
  void _resourceKey;
  void _resourceName;
  const groupedPermissions = React.useMemo(() => {
    const grouped: Record<string, Array<{action: PermissionAction, attributes: string[]}>> = {}

    Object.entries(permissions).forEach(([action, attributes]) => {
      const actionType = action.split(':')[0] // create, read, update, delete
      if (!grouped[actionType]) {
        grouped[actionType] = []
      }
      grouped[actionType].push({
        action: action as PermissionAction,
        attributes: Array.isArray(attributes) ? attributes : [attributes]
      })
    })

    return grouped
  }, [permissions])

  return (
    <div className="space-y-4 pl-4">
      {Object.entries(groupedPermissions).map(([actionType, actionPermissions]) => (
        <div key={actionType} className="space-y-2">
          <h4 className="font-medium capitalize flex items-center gap-2">
            <ActionIcon action={actionPermissions[0].action} />
            {actionType} Permissions
          </h4>
          
          <div className="space-y-2 ml-6">
            {actionPermissions.map(({ action, attributes }) => (
              <div key={action} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/30 p-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {PERMISSION_ACTIONS[action]}
                  </Badge>
                  {effective?.[action] && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Check className="h-3 w-3 text-green-600" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Permission is active</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                
                <AttributesBadge attributes={attributes} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Action Icon Component
 */
function ActionIcon({ action, className = "h-4 w-4" }: ActionIconProps) {
  const iconMap: Record<string, React.ReactNode> = {
    create: <Plus className={className} />,
    read: <Eye className={className} />,
    update: <Edit className={className} />,
    delete: <Trash className={className} />
  }

  const actionType = action.split(':')[0]
  return <>{iconMap[actionType] || <Shield className={className} />}</>
}

/**
 * Attributes Badge Component
 */
interface AttributesBadgeProps {
  attributes: string[]
}

function AttributesBadge({ attributes }: AttributesBadgeProps) {
  const hasWildcard = attributes.includes('*')
  const deniedAttrs = attributes.filter(attr => attr.startsWith('!')).length
  const allowedAttrs = attributes.filter(attr => !attr.startsWith('!') && attr !== '*').length

  if (hasWildcard && deniedAttrs === 0) {
    return (
      <Badge variant="default" className="text-xs">
        Full Access
      </Badge>
    )
  }

  if (hasWildcard && deniedAttrs > 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="secondary" className="text-xs">
              Restricted ({deniedAttrs} denied)
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-medium">Denied fields:</p>
              <div className="text-xs">
                {attributes
                  .filter(attr => attr.startsWith('!'))
                  .map(attr => attr.substring(1))
                  .join(', ')}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge variant="outline" className="text-xs">
            Limited ({allowedAttrs} fields)
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">Allowed fields:</p>
            <div className="text-xs">
              {attributes.filter(attr => !attr.startsWith('!')).join(', ')}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Quick Permission Status Component
 */
interface PermissionStatusProps {
  permissions: RolePermissions
  className?: string
}

export function PermissionStatus({ permissions, className }: PermissionStatusProps) {
  const resourceCount = Object.keys(permissions).length
  const totalPermissions = Object.values(permissions).reduce(
    (count, resource) => count + Object.keys(resource || {}).length,
    0
  )

  const status = React.useMemo(() => {
    if (totalPermissions === 0) return { type: 'none', label: 'No Access', color: 'destructive' as const }
    if (totalPermissions < 5) return { type: 'limited', label: 'Limited Access', color: 'secondary' as const }
    if (totalPermissions < 15) return { type: 'moderate', label: 'Moderate Access', color: 'default' as const }
    return { type: 'extensive', label: 'Extensive Access', color: 'default' as const }
  }, [totalPermissions])

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <Badge variant={status.color} className="text-xs">
          {status.label}
        </Badge>
        <span className="text-sm text-muted-foreground">
          {resourceCount} resources, {totalPermissions} permissions
        </span>
      </div>
    </div>
  )
}

/**
 * Permission Comparison Component
 */
interface PermissionComparisonProps {
  roleA: { name: string; permissions: RolePermissions }
  roleB: { name: string; permissions: RolePermissions }
  className?: string
}

export function PermissionComparison({ roleA, roleB, className }: PermissionComparisonProps) {
  const allResources = new Set([
    ...Object.keys(roleA.permissions),
    ...Object.keys(roleB.permissions)
  ])

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Permission Comparison</CardTitle>
        <p className="text-sm text-muted-foreground">
          Compare permissions between {roleA.name} and {roleB.name}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from(allResources).map(resource => {
            const permissionsA = roleA.permissions[resource] || {}
            const permissionsB = roleB.permissions[resource] || {}
            const actionsA = new Set(Object.keys(permissionsA))
            const actionsB = new Set(Object.keys(permissionsB))

            if (actionsA.size === 0 && actionsB.size === 0) return null

            return (
              <div key={resource} className="space-y-2">
                <h4 className="font-medium">{SYSTEM_RESOURCES[resource]?.name || resource}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Badge variant="outline" className="mb-2">{roleA.name}</Badge>
                    <div className="space-y-1">
                      {Object.keys(permissionsA).map(action => (
                        <div key={action} className="flex items-center gap-2">
                          <Check className="h-3 w-3 text-green-600" />
                          <span>{PERMISSION_ACTIONS[action as PermissionAction]}</span>
                        </div>
                      ))}
                      {actionsA.size === 0 && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <X className="h-3 w-3" />
                          <span>No access</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <Badge variant="outline" className="mb-2">{roleB.name}</Badge>
                    <div className="space-y-1">
                      {Object.keys(permissionsB).map(action => (
                        <div key={action} className="flex items-center gap-2">
                          <Check className="h-3 w-3 text-green-600" />
                          <span>{PERMISSION_ACTIONS[action as PermissionAction]}</span>
                        </div>
                      ))}
                      {actionsB.size === 0 && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <X className="h-3 w-3" />
                          <span>No access</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}