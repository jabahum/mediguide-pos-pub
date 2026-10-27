/**
 * Permission Builder Component
 * Visual interface for managing role permissions with resource/action matrix
 */

"use client"

import * as React from 'react'
import { Shield, Lock, Unlock, Eye, EyeOff } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import type {
  RolePermissions,
  PermissionAction,
  SystemResource
} from '@/types/permissions'
import {
  SYSTEM_RESOURCES,
  PERMISSION_ACTIONS,
  ACTION_GROUPS,
  PERMISSION_TEMPLATES
} from '@/types/permissions'

interface PermissionBuilderProps {
  permissions: RolePermissions
  onChange: (permissions: RolePermissions) => void
  disabled?: boolean
  showTemplates?: boolean
  onApplyTemplate?: (templateKey: string) => void
}

interface ResourcePermissionProps {
  resource: SystemResource
  permissions: RolePermissions[string]
  onChange: (resourceKey: string, permissions: RolePermissions[string]) => void
  disabled?: boolean
}

interface ActionPermissionProps {
  resource: SystemResource
  action: PermissionAction
  actionLabel: string
  granted: boolean
  attributes: string[]
  onChange: (granted: boolean, attributes: string[]) => void
  disabled?: boolean
}

/**
 * Main Permission Builder Component
 */
export function PermissionBuilder({
  permissions,
  onChange,
  disabled = false,
  showTemplates = true,
  onApplyTemplate
}: PermissionBuilderProps) {
  const [selectedResource, setSelectedResource] = React.useState<string>('users')
  const [viewMode, setViewMode] = React.useState<'matrix' | 'advanced'>('matrix')

  const handleResourcePermissionChange = React.useCallback((
    resourceKey: string,
    resourcePermissions: RolePermissions[string]
  ) => {
    const updatedPermissions = {
      ...permissions,
      [resourceKey]: resourcePermissions
    }
    onChange(updatedPermissions)
  }, [permissions, onChange])

  const handleTemplateApply = React.useCallback((templateKey: string) => {
    if (onApplyTemplate) {
      onApplyTemplate(templateKey)
    }
  }, [onApplyTemplate])

  const resources = Object.values(SYSTEM_RESOURCES)

  return (
    <div className="min-w-0 space-y-6">
      {/* Templates Section */}
      {showTemplates && (
        <Card className="min-w-0 rounded-xl shadow-xs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Permission Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.keys(PERMISSION_TEMPLATES).map((templateKey) => (
                <Button
                  key={templateKey}
                  variant="outline"
                  size="sm"
                  onClick={() => handleTemplateApply(templateKey)}
                  disabled={disabled}
                >
                  {templateKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Templates save immediately and replace the role’s configured permissions. Unsaved builder changes are replaced.
            </p>
          </CardContent>
        </Card>
      )}

      {/* View Mode Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-medium">Permission Configuration</h3>
        <Select value={viewMode} onValueChange={(value: 'matrix' | 'advanced') => setViewMode(value)}>
          <SelectTrigger aria-label="Permission editor view" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="matrix">Matrix View</SelectItem>
            <SelectItem value="advanced">Advanced View</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={viewMode} onValueChange={(value: string) => setViewMode(value as 'matrix' | 'advanced')}>
        <TabsContent value="matrix" className="space-y-4">
          {/* Resource Selection */}
          <div className="mb-4 flex flex-wrap gap-2 rounded-xl border bg-muted/20 p-3">
            {resources.map((resource) => (
              <Button
                key={resource.key}
                variant={selectedResource === resource.key ? "default" : "outline"}
                size="sm"
                aria-pressed={selectedResource === resource.key}
                onClick={() => setSelectedResource(resource.key)}
                disabled={disabled}
              >
                {resource.name}
              </Button>
            ))}
          </div>

          {/* Selected Resource Permissions */}
          {selectedResource && (
            <ResourcePermissionMatrix
              resource={SYSTEM_RESOURCES[selectedResource]}
              permissions={permissions[selectedResource] || {}}
              onChange={(resourceKey, perms) => handleResourcePermissionChange(resourceKey, perms)}
              disabled={disabled}
            />
          )}
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <AdvancedPermissionView
            permissions={permissions}
            onChange={onChange}
            disabled={disabled}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

/**
 * Resource Permission Matrix View
 */
function ResourcePermissionMatrix({
  resource,
  permissions,
  onChange,
  disabled
}: ResourcePermissionProps) {
  const handleActionChange = React.useCallback((
    action: PermissionAction,
    granted: boolean,
    attributes: string[]
  ) => {
    const updatedPermissions = { ...permissions }

    if (granted) {
      updatedPermissions[action] = attributes
    } else {
      delete updatedPermissions[action]
    }

    onChange(resource.key, updatedPermissions)
  }, [permissions, onChange, resource.key])

  return (
    <Card className="min-w-0 rounded-xl shadow-xs">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          {resource.name}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{resource.description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Action Groups */}
        {Object.entries(ACTION_GROUPS).map(([groupName, actions]) => (
          <div key={groupName} className="space-y-2">
            <h4 className="font-medium capitalize">{groupName} Permissions</h4>
            <div className="grid gap-4 lg:grid-cols-2">
              {actions.map((action) => (
                <ActionPermissionControl
                  key={action}
                  resource={resource}
                  action={action}
                  actionLabel={PERMISSION_ACTIONS[action]}
                  granted={!!permissions[action]}
                  attributes={permissions[action] || ['*']}
                  onChange={(granted, attributes) => handleActionChange(action, granted, attributes)}
                  disabled={disabled}
                />
              ))}
            </div>
            {groupName !== 'delete' && <Separator />}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

/**
 * Individual Action Permission Control
 */
function ActionPermissionControl({
  resource,
  action,
  actionLabel,
  granted,
  attributes,
  onChange,
  disabled
}: ActionPermissionProps) {
  const [showAttributeEditor, setShowAttributeEditor] = React.useState(false)
  const [editingAttributes, setEditingAttributes] = React.useState<string[]>(attributes)

  const handleGrantedChange = React.useCallback((checked: boolean) => {
    onChange(checked, checked ? ['*'] : [])
    if (!checked) {
      setShowAttributeEditor(false)
    }
  }, [onChange])

  const handleAttributeSave = React.useCallback(() => {
    onChange(true, editingAttributes)
    setShowAttributeEditor(false)
  }, [onChange, editingAttributes])

  const isRestricted = granted && !attributes.includes('*')

  return (
    <div className="min-w-0 space-y-3 rounded-xl border bg-muted/10 p-4">
      {/* Action Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`${resource.key}-${action}`}
            checked={granted}
            onCheckedChange={handleGrantedChange}
            disabled={disabled}
          />
          <Label htmlFor={`${resource.key}-${action}`} className="font-medium">
            {actionLabel}
          </Label>
        </div>

        {granted && (
          <div className="flex items-center gap-1">
            <Badge variant={isRestricted ? "secondary" : "default"} className="text-xs">
              {isRestricted ? "Restricted" : "Full Access"}
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowAttributeEditor(!showAttributeEditor)}
              disabled={disabled}
            >
              {showAttributeEditor ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </Button>
          </div>
        )}
      </div>

      {/* Attribute Editor */}
      {granted && showAttributeEditor && (
        <div className="space-y-2 pl-6 border-l-2">
          <Label className="text-sm font-medium">Field Access Control</Label>
          <AttributeSelector
            resource={resource}
            attributes={editingAttributes}
            onChange={setEditingAttributes}
            disabled={disabled}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAttributeSave} disabled={disabled}>
              Apply
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAttributeEditor(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {granted && !showAttributeEditor && (
        <div className="flex gap-1 pl-6">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onChange(true, ['*'])}
            disabled={disabled || attributes.includes('*')}
          >
            <Unlock className="h-3 w-3" />
            Full
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAttributeEditor(true)}
            disabled={disabled}
          >
            <Lock className="h-3 w-3" />
            Restrict
          </Button>
        </div>
      )}
    </div>
  )
}

/**
 * Attribute Selector for Fine-grained Permissions
 */
interface AttributeSelectorProps {
  resource: SystemResource
  attributes: string[]
  onChange: (attributes: string[]) => void
  disabled?: boolean
}

function AttributeSelector({ resource, attributes, onChange, disabled }: AttributeSelectorProps) {
  const [mode, setMode] = React.useState<'allow' | 'deny'>(
    attributes.includes('*') ? 'deny' : 'allow'
  )

  const availableFields = resource.fields.filter(field => field !== '*')
  // const hasWildcard = attributes.includes('*')
  const deniedFields = attributes.filter(attr => attr.startsWith('!')).map(attr => attr.substring(1))
  const allowedFields = attributes.filter(attr => !attr.startsWith('!') && attr !== '*')

  const handleModeChange = React.useCallback((newMode: 'allow' | 'deny') => {
    setMode(newMode)
    if (newMode === 'allow') {
      onChange(availableFields.slice(0, Math.ceil(availableFields.length / 2)))
    } else {
      onChange(['*'])
    }
  }, [availableFields, onChange])

  const handleFieldToggle = React.useCallback((field: string, checked: boolean) => {
    if (mode === 'allow') {
      const newAllowed = checked
        ? [...allowedFields, field]
        : allowedFields.filter(f => f !== field)
      onChange(newAllowed)
    } else {
      const newDenied = checked
        ? deniedFields.filter(f => f !== field)
        : [...deniedFields, field]
      onChange(['*', ...newDenied.map(f => `!${f}`)])
    }
  }, [mode, allowedFields, deniedFields, onChange])

  return (
    <div className="space-y-3">
      {/* Mode Selection */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={mode === 'allow' ? 'default' : 'outline'}
          onClick={() => handleModeChange('allow')}
          disabled={disabled}
        >
          Allow Only
        </Button>
        <Button
          size="sm"
          variant={mode === 'deny' ? 'default' : 'outline'}
          onClick={() => handleModeChange('deny')}
          disabled={disabled}
        >
          Allow All Except
        </Button>
      </div>

      {/* Field Selection */}
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {availableFields.map((field) => {
          const isSelected = mode === 'allow'
            ? allowedFields.includes(field)
            : !deniedFields.includes(field)

          return (
            <div key={field} className="flex items-center space-x-2">
              <Checkbox
                id={`field-${field}`}
                checked={isSelected}
                onCheckedChange={(checked) => handleFieldToggle(field, checked as boolean)}
                disabled={disabled}
              />
              <Label htmlFor={`field-${field}`} className="text-sm font-mono">
                {field}
              </Label>
            </div>
          )
        })}
      </div>

      {/* Attribute Preview */}
      <div className="text-xs text-muted-foreground">
        <strong>Result:</strong> {JSON.stringify(attributes)}
      </div>
    </div>
  )
}

/**
 * Advanced Permission View (JSON Editor)
 */
interface AdvancedPermissionViewProps {
  permissions: RolePermissions
  onChange: (permissions: RolePermissions) => void
  disabled?: boolean
}

function AdvancedPermissionView({ permissions, onChange, disabled }: AdvancedPermissionViewProps) {
  const [jsonValue, setJsonValue] = React.useState(JSON.stringify(permissions, null, 2))
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    setJsonValue(JSON.stringify(permissions, null, 2))
  }, [permissions])

  const handleJsonChange = React.useCallback((value: string) => {
    setJsonValue(value)
    try {
      const parsed = JSON.parse(value)
      setError(null)
      onChange(parsed)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON')
    }
  }, [onChange])

  return (
    <Card className="min-w-0 rounded-xl shadow-xs">
      <CardHeader>
        <CardTitle>Advanced Permission Editor</CardTitle>
        <p className="text-sm text-muted-foreground">
          Direct JSON editing for advanced users. Be careful when making changes.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={jsonValue}
          onChange={(e) => handleJsonChange(e.target.value)}
          disabled={disabled}
          className="font-mono text-sm min-h-96"
          placeholder="Permission JSON..."
        />
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
            <strong>JSON Error:</strong> {error}
          </div>
        )}
      </CardContent>
    </Card>
  )
}