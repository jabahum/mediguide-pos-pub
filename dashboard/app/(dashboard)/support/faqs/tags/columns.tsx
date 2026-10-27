"use client"

import { SupportStatusBadge } from "@/components/support/support-section"
import type { ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeader } from "@/components/ui/datatable-column-header"
import { formatDistanceToNow } from "date-fns"
import type { FaqTagWithStats } from "@/types/faq"

export const columns: ColumnDef<FaqTagWithStats>[] = [
  // Main content - always visible
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
      const name = row.getValue("name") as string
      return (
        <span className="block min-w-[180px] max-w-sm whitespace-normal break-words font-semibold">{name}</span>
      )
    },
    enableSorting: true,
    enableHiding: false,
  },

  // Status - important for management
  {
    accessorKey: "is_active",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const isActive = row.getValue("is_active") as boolean
      return (
        <SupportStatusBadge status={isActive ? "active" : "inactive"} />
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    enableHiding: false,
  },

  // Usage - key metric
  {
    accessorKey: "usage_count",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Usage" />
    ),
    cell: ({ row }) => {
      const usageCount = row.getValue("usage_count") as number
      const faqCount = row.original.faq_count
      
      const count = faqCount !== undefined ? faqCount : usageCount || 0
      
      return (
        <div className="text-center">
          <span className="font-semibold">{count}</span>
        </div>
      )
    },
    enableSorting: true,
    enableHiding: false,
  },

  // Individual simple fields
  {
    accessorKey: "description",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Description" />
    ),
    cell: ({ row }) => {
      const description = row.getValue("description") as string
      
      if (!description) {
        return <span className="text-muted-foreground text-sm">-</span>
      }
      
      return (
        <span className="block max-w-md whitespace-normal break-words text-sm leading-6" title={description}>
          {description}
        </span>
      )
    },
    enableSorting: false,
    enableHiding: true,
  },

  {
    accessorKey: "color",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Color" />
    ),
    cell: ({ row }) => {
      const color = row.getValue("color") as string || 'primary'
      
      const colorLabels = {
        primary: "Primary",
        secondary: "Secondary", 
        destructive: "Destructive",
        muted: "Muted",
        accent: "Accent",
        popover: "Popover",
      }
      
      return (
        <span className="text-sm">
          {colorLabels[color as keyof typeof colorLabels] || color}
        </span>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    enableHiding: true,
  },

  {
    accessorKey: "updated",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Updated" />
    ),
    cell: ({ row }) => {
      const updated = row.getValue("updated") as string
      
      return (
        <span className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(updated), { addSuffix: true })}
        </span>
      )
    },
    enableSorting: true,
    enableHiding: false,
  },

  // Additional fields that can be hidden by default
  {
    accessorKey: "slug",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Slug" />
    ),
    cell: ({ row }) => {
      const slug = row.getValue("slug") as string
      
      return (
        <code className="text-xs bg-muted px-2 py-1 rounded">
          {slug}
        </code>
      )
    },
    enableSorting: true,
    enableHiding: true,
  },

  {
    accessorKey: "sort_order",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Order" />
    ),
    cell: ({ row }) => {
      const sortOrder = row.getValue("sort_order") as number
      
      return (
        <span className="text-sm text-center">
          {sortOrder || 0}
        </span>
      )
    },
    enableSorting: true,
    enableHiding: true,
  },

  {
    accessorKey: "created",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) => {
      const created = row.getValue("created") as string
      
      return (
        <span className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(created), { addSuffix: true })}
        </span>
      )
    },
    enableSorting: true,
    enableHiding: true,
  },
]