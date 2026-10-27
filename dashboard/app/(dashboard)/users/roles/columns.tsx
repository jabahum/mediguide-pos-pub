"use client"

import Link from "next/link"
import { UserStatusBadge } from "@/components/users/user-section"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { CalendarDays, Shield, FileText } from "lucide-react"

import { DataTableColumnHeader } from "@/components/ui/datatable-column-header"
import { Role } from "./types"

export const columns: ColumnDef<Role>[] = [
  // Role Name with icon
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Role Name"
        canSort={true}
        canFilter={true}
        filterType="text"
      />
    ),
    cell: ({ row }) => {
      const role = row.original
      return (
        <div className="flex min-w-[220px] items-center gap-3">
          <span className="rounded-xl border bg-muted/50 p-2.5"><Shield className="size-5 text-muted-foreground" aria-hidden="true" /></span>
          <div className="min-w-0"><Link href={`/users/roles/${role.id}/permissions`} className="whitespace-normal break-words font-semibold hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{role.name}</Link><p className="mt-1 text-xs text-muted-foreground">{role.key}</p></div>
        </div>
      )
    },
    enableSorting: true,
    sortingFn: (rowA, rowB) => {
      return rowA.original.name.localeCompare(rowB.original.name)
    },
  },

  // Description
  {
    accessorKey: "description",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Description"
        canSort={false}
        canFilter={true}
        filterType="text"
      />
    ),
    cell: ({ row }) => {
      const description = row.original.description
      if (!description) {
        return <span className="text-muted-foreground">—</span>
      }
      return (
        <div className="flex max-w-lg items-start gap-2">
          <FileText className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
          <span className="whitespace-normal break-words text-sm leading-6" title={description}>
            {description}
          </span>
        </div>
      )
    },
    enableSorting: false,
  },

  // Status (Active/Inactive)
  {
    accessorKey: "isActive",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Status"
        canSort={true}
        canFilter={true}
        filterType="boolean"
      />
    ),
    cell: ({ row }) => {
      const isActive = row.original.isActive
      return (
        <UserStatusBadge status={isActive ? "active" : "inactive"} />
      )
    },
    enableSorting: true,
    filterFn: (row, id, value) => {
      const isActive = row.original.isActive
      if (value === "true") return isActive === true
      if (value === "false") return isActive === false
      return true
    },
  },

  // Created Date
  {
    accessorKey: "created",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Created"
        canSort={true}
        canFilter={true}
        filterType="dateRange"
      />
    ),
    cell: ({ row }) => {
      const created = row.original.created
      try {
        const date = new Date(created)
        return (
          <div className="flex items-center space-x-1 text-sm">
            <CalendarDays className="h-3 w-3 text-muted-foreground" />
            <span title={format(date, 'PPpp')}>
              {format(date, 'MMM dd, yyyy')}
            </span>
          </div>
        )
      } catch {
        return <span className="text-muted-foreground">Invalid date</span>
      }
    },
    enableSorting: true,
    enableHiding: true,
  },

  // Updated Date
  {
    accessorKey: "updated",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Updated"
        canSort={true}
        canFilter={true}
        filterType="dateRange"
      />
    ),
    cell: ({ row }) => {
      const updated = row.original.updated
      try {
        const date = new Date(updated)
        return (
          <div className="flex items-center space-x-1 text-sm">
            <CalendarDays className="h-3 w-3 text-muted-foreground" />
            <span title={format(date, 'PPpp')}>
              {format(date, 'MMM dd, yyyy')}
            </span>
          </div>
        )
      } catch {
        return <span className="text-muted-foreground">Invalid date</span>
      }
    },
    enableSorting: true,
    enableHiding: true,
  },
]

// Helper functions for role status
export function getRoleStatusVariant(isActive?: boolean): "default" | "secondary" {
  return isActive ? "default" : "secondary"
}

export function getRoleStatusLabel(isActive?: boolean): string {
  return isActive ? "Active" : "Inactive"
}