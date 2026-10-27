"use client"

import Link from "next/link"
import { SupportStatusBadge } from "@/components/support/support-section"
import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader } from "@/components/ui/datatable-column-header"
import { format, formatDistanceToNow } from "date-fns"
import type { FaqsWithExpanded } from "@/types/expanded"

export const columns: ColumnDef<FaqsWithExpanded>[] = [
  // Main content - always visible
  {
    accessorKey: "question",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Question" />
    ),
    cell: ({ row }) => {
      const question = row.getValue("question") as string
      return (
        <Link href={`/support/faqs/${row.original.id}`} className="block min-w-[240px] max-w-xl whitespace-normal break-words font-semibold hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" title={question}>
          {question}
        </Link>
      )
    },
    enableSorting: true,
    enableHiding: false,
  },
  
  // Status and metadata - key for management
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      
      return <SupportStatusBadge status={status} />
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    enableHiding: false,
  },

  // Individual simple fields
  {
    accessorKey: "is_featured",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Featured" />
    ),
    cell: ({ row }) => {
      const isFeatured = row.getValue("is_featured") as boolean
      return isFeatured ? (
        <Badge variant="secondary" className="text-xs">Featured</Badge>
      ) : (
        <span className="text-muted-foreground text-xs">-</span>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    enableHiding: true,
  },

  {
    accessorKey: "priority",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Priority" />
    ),
    cell: ({ row }) => {
      const priority = row.getValue("priority") as string
      
      const priorityConfig = {
        low: { label: "Low", variant: "outline" as const },
        normal: { label: "Normal", variant: "secondary" as const },
        high: { label: "High", variant: "default" as const },
        critical: { label: "Critical", variant: "destructive" as const },
      }
      
      const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.normal
      
      return (
        <Badge variant={config.variant} className="font-medium">
          {config.label}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    enableHiding: false,
  },

  {
    accessorKey: "target_audience",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Audience" />
    ),
    cell: ({ row }) => {
      const audience = row.getValue("target_audience") as string
      
      const audienceLabels = {
        all: "All Users",
        admin: "Administrators",
        health_worker: "Health Workers", 
        patient: "Patients",
      }
      
      return (
        <span className="text-sm">
          {audienceLabels[audience as keyof typeof audienceLabels] || audience}
        </span>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    enableHiding: true,
  },

  // Tags - simplified to count only
  {
    accessorKey: "expand.tags",
    header: "Tags",
    cell: ({ row }) => {
      const tags = row.original.expand?.tags || []
      
      if (tags.length === 0) {
        return <span className="text-muted-foreground text-sm">None</span>
      }
      
      return (
        <div className="text-center">
          <div className="font-semibold">{tags.length}</div>
          <div className="text-xs text-muted-foreground">tag{tags.length !== 1 ? 's' : ''}</div>
        </div>
      )
    },
    enableSorting: false,
    enableHiding: true,
  },

  // Author - name only
  {
    accessorKey: "expand.author.name", 
    header: "Author",
    cell: ({ row }) => {
      const author = row.original.expand?.author
      
      if (!author) {
        return <span className="text-muted-foreground text-sm">No author</span>
      }
      
      return (
        <span className="text-sm font-medium">
          {author.name || 'Unknown'}
        </span>
      )
    },
    enableSorting: false,
    enableHiding: true,
  },

  // Dates - simplified
  {
    accessorKey: "published_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Published" />
    ),
    cell: ({ row }) => {
      const publishedAt = row.getValue("published_at") as string
      const status = row.original.status
      
      if (status !== 'published' || !publishedAt) {
        return <span className="text-muted-foreground text-sm">-</span>
      }
      
      return (
        <span className="text-sm">
          {format(new Date(publishedAt), "MMM dd, yyyy")}
        </span>
      )
    },
    enableSorting: true,
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
    accessorKey: "keywords",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Keywords" />
    ),
    cell: ({ row }) => {
      const keywords = row.getValue("keywords") as string
      
      if (!keywords) {
        return <span className="text-muted-foreground text-sm">-</span>
      }
      
      return (
        <span className="text-xs line-clamp-2 max-w-[150px]" title={keywords}>
          {keywords}
        </span>
      )
    },
    enableSorting: false,
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
          {format(new Date(created), "MMM dd, yyyy")}
        </span>
      )
    },
    enableSorting: true,
    enableHiding: true,
  },
]