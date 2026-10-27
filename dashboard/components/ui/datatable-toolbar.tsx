"use client"

import * as React from "react"
import { Table } from "@tanstack/react-table"
import { Search, RefreshCw, ChevronDown, Download, Loader2, Plus, Filter } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTableBulkActions } from "@/components/ui/datatable-bulk-actions"
import { DataTableImport } from "@/components/ui/datatable-import"
import {
  BaseRecord,
  ExportFormat,
  DataTableToolbarProps,
  AdvancedFilter,
  FieldOption,
  FilterCondition,
  FilterType,
  ImportOptions,
  ImportResult
} from "@/types/data-table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ActiveFiltersPopup } from "@/components/ui/active-filters-popup"
import { FilterValueInput } from "@/components/ui/datatable-filter-value-input"
import { cn, snakeToTitleCase } from "@/lib/utils"

interface DataTableToolbarComponentProps<TData extends BaseRecord>
  extends DataTableToolbarProps<TData> {
  table: Table<TData>
  appearance?: "default" | "workspace"
  searchLabel?: string
  title?: string
  description?: string
  exportFormats?: ExportFormat[]
  importFormats?: ExportFormat[]
  availableFields?: FieldOption[]
  onExport?: (format: ExportFormat, selectedOnly?: boolean) => void
  onImport?: (file: File, format: ExportFormat, options: ImportOptions) => Promise<ImportResult>
  onAdvancedFilter?: (filters: AdvancedFilter[]) => void
  onGlobalFilterChange?: (filter: string) => void
  onResetColumns?: () => void
}

export function DataTableToolbar<TData extends BaseRecord>({
  appearance = "default",
  searchLabel = "Search records",
  table,
  title,
  description,
  searchable = true,
  searchPlaceholder = "Search...",
  bulkActions = [],
  selectedRows = [],
  exportFormats = ['csv', 'json'],
  importFormats = ['csv', 'json'],
  availableFields = [],
  onRefresh,
  onExport,
  onImport,
  onAdvancedFilter,
  onGlobalFilterChange,
  onResetColumns,
  loading = false,
}: DataTableToolbarComponentProps<TData>) {
  const [globalFilter, setGlobalFilter] = React.useState<string>(
    table.getState().globalFilter || ""
  )
  const [showExport, setShowExport] = React.useState(false)
  const [showAdvancedFilter, setShowAdvancedFilter] = React.useState(false)
  const [advancedFilters, setAdvancedFilters] = React.useState<AdvancedFilter[]>([])
  
  // New filter form state
  const [newFilter, setNewFilter] = React.useState<{
    field: string
    condition: FilterCondition
    value: string
    displayValue?: string
  }>({
    field: '',
    condition: 'equals',
    value: '',
    displayValue: undefined,
  })

  const selectedField = React.useMemo(
    () => availableFields.find((f) => f.value === newFilter.field),
    [availableFields, newFilter.field]
  )

  // When picking a select/relation field, only equals / not_equals make sense
  const isChoiceField = !!(selectedField?.type === 'select' && (selectedField.options?.length || selectedField.relation))

  const isFiltered = table.getState().columnFilters.length > 0 || globalFilter.length > 0 || advancedFilters.length > 0
  const hasSelectedRows = selectedRows.length > 0

  // Condition options based on field type
  const getConditionsForType = (type: FilterType): { label: string; value: FilterCondition }[] => {
    const baseConditions = [
      { label: 'Equals', value: 'equals' as FilterCondition },
      { label: 'Not equals', value: 'not_equals' as FilterCondition },
      { label: 'Is empty', value: 'is_empty' as FilterCondition },
      { label: 'Is not empty', value: 'is_not_empty' as FilterCondition }
    ]

    switch (type) {
      case 'text':
        return [
          ...baseConditions,
          { label: 'Contains', value: 'contains' as FilterCondition },
          { label: 'Starts with', value: 'starts_with' as FilterCondition },
          { label: 'Ends with', value: 'ends_with' as FilterCondition }
        ]
      case 'number':
      case 'date':
        return [
          ...baseConditions,
          { label: 'Greater than', value: 'greater_than' as FilterCondition },
          { label: 'Less than', value: 'less_than' as FilterCondition },
          { label: 'Greater or equal', value: 'greater_equal' as FilterCondition },
          { label: 'Less or equal', value: 'less_equal' as FilterCondition }
        ]
      default:
        return baseConditions
    }
  }

  const addAdvancedFilter = () => {
    if (!newFilter.field || (!newFilter.value && !['is_empty', 'is_not_empty'].includes(newFilter.condition))) {
      return
    }

    const filter: AdvancedFilter = {
      id: `${newFilter.field}-${newFilter.condition}-${Date.now()}`,
      field: newFilter.field,
      condition: newFilter.condition,
      value: newFilter.value,
      displayValue: newFilter.displayValue,
    }

    const updatedFilters = [...advancedFilters, filter]
    setAdvancedFilters(updatedFilters)
    onAdvancedFilter?.(updatedFilters)

    // Reset form
    setNewFilter({
      field: '',
      condition: 'equals',
      value: '',
      displayValue: undefined,
    })
    setShowAdvancedFilter(false)
  }

  const removeAdvancedFilter = (filterId: string) => {
    const updatedFilters = advancedFilters.filter(f => f.id !== filterId)
    setAdvancedFilters(updatedFilters)
    onAdvancedFilter?.(updatedFilters)
  }

  // Handle global search with debounce
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      onGlobalFilterChange?.(globalFilter)
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [globalFilter, onGlobalFilterChange])



  return (
    <div className={cn("space-y-4", appearance === "workspace" && "rounded-xl border bg-card p-4 shadow-xs sm:p-5")}>
      {/* Header */}
      {(title || description) && (
        <div>
          {title && <h2 className={appearance === "workspace" ? "text-base font-semibold" : "text-2xl font-bold tracking-tight"}>{title}</h2>}
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      {/* Main toolbar */}
      <div className={appearance === "workspace" ? "flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between" : "flex items-center justify-between"}>
        <div className={appearance === "workspace" ? "flex min-w-0 flex-1 flex-wrap items-end gap-2" : "flex flex-1 items-center space-x-2"}>
          {/* Global search */}
          {searchable && (
            <div className={appearance === "workspace" ? "min-w-0 basis-full sm:flex-1 sm:basis-auto" : "relative w-full max-w-sm"}>
              {appearance === "workspace" && <p className="mb-2 text-xs font-medium">{searchLabel}</p>}
              <div className="relative">
              <Search aria-hidden="true" className={cn("pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground", appearance === "workspace" && "left-3 top-3")} />
              <Input
                aria-label={appearance === "workspace" ? searchLabel : undefined}
                type={appearance === "workspace" ? "search" : undefined}
                placeholder={searchPlaceholder}
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className={cn("pl-8", appearance === "workspace" && "h-10 rounded-lg pl-9")}
              />
              </div>
            </div>
          )}

          {/* Advanced Filter Dropdown */}
          {availableFields.length > 0 && (
            <DropdownMenu open={showAdvancedFilter} onOpenChange={setShowAdvancedFilter}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className={appearance === "workspace" ? "h-10" : undefined}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Filter
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-80 p-4">
                <div className="space-y-4">
                  <h4 className="font-medium leading-none">Add Filter</h4>
                  
                  {/* Field Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Field</label>
                    <Select
                      value={newFilter.field}
                      onValueChange={(value) => {
                        const field = availableFields.find((f) => f.value === value)
                        const nextIsChoice = !!(field?.type === 'select' && (field.options?.length || field.relation))
                        setNewFilter({
                          field: value,
                          // Choice fields only support equals/not_equals — reset condition if previous one is incompatible
                          condition: nextIsChoice && !['equals', 'not_equals'].includes(newFilter.condition)
                            ? 'equals'
                            : newFilter.condition,
                          value: '',
                          displayValue: undefined,
                        })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select field to filter" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFields.map((field) => (
                          <SelectItem key={field.value} value={field.value}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Condition Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Condition</label>
                    <Select
                      value={newFilter.condition}
                      onValueChange={(value) => setNewFilter({ ...newFilter, condition: value as FilterCondition })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(isChoiceField
                          ? [
                              { label: 'Equals', value: 'equals' as FilterCondition },
                              { label: 'Not equals', value: 'not_equals' as FilterCondition },
                            ]
                          : getConditionsForType(selectedField?.type || 'text')
                        ).map((condition) => (
                          <SelectItem key={condition.value} value={condition.value}>
                            {condition.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Value Input - Only show if condition requires a value */}
                  {!['is_empty', 'is_not_empty'].includes(newFilter.condition) && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Value</label>
                      <FilterValueInput
                        field={selectedField}
                        value={newFilter.value}
                        onChange={(value, displayValue) =>
                          setNewFilter({ ...newFilter, value, displayValue })
                        }
                      />
                    </div>
                  )}

                  {/* Add Filter Button */}
                  <Button 
                    onClick={addAdvancedFilter}
                    disabled={!newFilter.field || (!newFilter.value && !['is_empty', 'is_not_empty'].includes(newFilter.condition))}
                    className="w-full"
                  >
                    Add Filter
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Active Filters Popup */}
          {advancedFilters.length > 0 && (
            <ActiveFiltersPopup
              filters={advancedFilters}
              availableFields={availableFields}
              onRemoveFilter={removeAdvancedFilter}
              onClearAllFilters={() => {
                setAdvancedFilters([])
                onAdvancedFilter?.([])
              }}
            >
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filters ({advancedFilters.length})
              </Button>
            </ActiveFiltersPopup>
          )}

        </div>

        <div className={appearance === "workspace" ? "flex flex-wrap items-center gap-2 lg:shrink-0" : "flex items-center space-x-2"}>
          {/* Export */}
          {exportFormats.length > 0 && onExport && (
            <DropdownMenu open={showExport} onOpenChange={setShowExport}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {exportFormats.map((format) => (
                  <React.Fragment key={format}>
                    <DropdownMenuItem
                      onClick={() => onExport(format, false)}
                    >
                      Export all as {format.toUpperCase()}
                    </DropdownMenuItem>
                    {hasSelectedRows && (
                      <DropdownMenuItem
                        onClick={() => onExport(format, true)}
                      >
                        Export selected as {format.toUpperCase()}
                      </DropdownMenuItem>
                    )}
                  </React.Fragment>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Import */}
          {importFormats.length > 0 && onImport && (
            <DataTableImport
              formats={importFormats}
              onImport={onImport}
            />
          )}

          {/* Column visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Columns
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-auto min-w-[200px] max-w-[300px]">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter((column) => typeof column.accessorFn !== "undefined" && column.getCanHide())
                .map((column) => {
                  // Convert column ID to a more readable format
                  const label = column.id.includes('_') ? snakeToTitleCase(column.id) : column.id
                  
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                      className="justify-start"
                    >
                      <span className="truncate" title={label}>
                        {label}
                      </span>
                    </DropdownMenuCheckboxItem>
                  )
                })}
                {onResetColumns && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={onResetColumns}
                      className="text-destructive"
                    >
                      Reset to Default
                    </DropdownMenuItem>
                  </>
                )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Refresh */}
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
          )}
        </div>
      </div>


      {/* Filter summary */}
      {isFiltered && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            <span>
              {table.getFilteredRowModel().rows.length} of{" "}
              {table.getCoreRowModel().rows.length} row(s) shown
            </span>
            {hasSelectedRows && (
              <>
                <span>•</span>
                <span>{selectedRows.length} row(s) selected</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Bulk actions row - separate row below main toolbar */}
      {hasSelectedRows && bulkActions.length > 0 && (
        <DataTableBulkActions
          selectedRows={selectedRows}
          actions={bulkActions}
          onAction={async (actionId, rows) => {
            const action = bulkActions.find(a => a.id === actionId)
            if (action) {
              await action.onClick(rows)
            }
          }}
          onClearSelection={() => table.toggleAllRowsSelected(false)}
        />
      )}
    </div>
  )
}
