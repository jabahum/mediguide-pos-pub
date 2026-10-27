"use client"

import { ColumnDef } from "@tanstack/react-table"
import { BellPlus, Eye, FilePlus2, Link2, MoreHorizontal, Pencil, Trash2, Upload } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { GuidelineStatusBadge } from "@/components/guidelines/guideline-section"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { GuidelinePublicationAction } from "./components/guideline-publication-action"
import { Button } from "@/components/ui/button"
import { DataTableColumnHeader } from "@/components/ui/datatable-column-header"
import { getGuidelineWorkStatus, isDocumentPublished } from "./document-state"
import {
  getDocumentCurrentVersion,
  getDocumentLatestVersion,
  GuidelineDocumentRecord,
  isPublishedAsLink,
} from "@/services/guideline-documents.service"

interface GuidelineColumnActions {
  canUpdate: boolean
  canNotify: boolean
  canDelete: boolean
  canPublish: boolean
  onChanged: () => Promise<unknown>
  onView: (document: GuidelineDocumentRecord) => void
  onEdit: (document: GuidelineDocumentRecord) => void
  onNewVersion: (document: GuidelineDocumentRecord) => void
  onUpload: (document: GuidelineDocumentRecord) => void
  onNotify: (document: GuidelineDocumentRecord) => void
  onDelete: (document: GuidelineDocumentRecord) => void
}

export function createGuidelinesColumns({
  canUpdate,
  canNotify,
  canDelete,
  canPublish,
  onChanged,
  onView,
  onEdit,
  onNewVersion,
  onUpload,
  onNotify,
  onDelete,
}: GuidelineColumnActions): ColumnDef<GuidelineDocumentRecord>[] {
  return [
    {
      accessorKey: "title",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Guideline" />,
      cell: ({ row }) => (
        <div className="min-w-[200px] max-w-md whitespace-normal break-words">
          <button type="button" className="text-left font-semibold leading-6 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => onView(row.original)}>{row.original.title}</button>
          {row.original.source_org && <p className="mt-1 text-xs leading-5 text-muted-foreground">{row.original.source_org}</p>}
        </div>
      ),
      size: 360,
    },
    {
      id: "document_kind",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Kind" />,
      accessorFn: (document) => document.document_kind?.name || "",
      cell: ({ row }) =>
        row.original.document_kind ? (
          <Badge variant="outline" className="whitespace-nowrap">
            {row.original.document_kind.name}
          </Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
      size: 120,
    },
    {
      accessorKey: "program_area",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Program Area" />,
      cell: ({ row }) => (
        <div className="min-w-[120px] max-w-[200px] whitespace-normal break-words leading-5">
          {row.original.program_area || <span className="text-muted-foreground">—</span>}
        </div>
      ),
      size: 240,
    },
    {
      accessorKey: "country",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Country" />,
      cell: ({ row }) => (
        <div className="min-w-[80px] max-w-[160px] whitespace-normal break-words">
          {row.original.country || <span className="text-muted-foreground">—</span>}
        </div>
      ),
      size: 150,
    },
    {
      id: "current_version",
      header: "Edition & status",
      accessorFn: (document) => getDocumentCurrentVersion(document)?.version || "",
      cell: ({ row }) => {
        const version = getDocumentCurrentVersion(row.original)
        const latest = getDocumentLatestVersion(row.original)
        return <div className="min-w-[140px] space-y-2">
          {row.original.withdrawn_at ? <GuidelineStatusBadge status="withdrawn" /> : version ? <div className="flex flex-wrap items-center gap-2"><span className="font-medium">v{version.version}</span><GuidelineStatusBadge status={version.status === "published" && version.id !== row.original.current_version_id ? "previously_published" : getGuidelineWorkStatus(version)} /></div> : <span className="text-sm text-muted-foreground">No version yet</span>}
          {latest && latest.id !== version?.id && latest.status !== "published" && <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"><span>Working v{latest.version}</span><GuidelineStatusBadge status={getGuidelineWorkStatus(latest)} /></div>}
        </div>
      },
      size: 190,
    },
    {
      accessorKey: "language",
      header: "Language",
      cell: ({ row }) => (
        <div className="min-w-[60px] whitespace-normal break-words">
          {(row.original.language || "en").toUpperCase()}
        </div>
      ),
      size: 110,
    },
    {
      accessorKey: "updated_at",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Updated" />,
      cell: ({ row }) => (
        <div className="min-w-[90px] text-xs text-muted-foreground">{Number.isFinite(Date.parse(row.original.updated_at)) ? <time dateTime={row.original.updated_at}>{new Date(row.original.updated_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</time> : "Not recorded"}</div>
      ),
      size: 130,
    },
    {
      id: "actions",
      enableHiding: false,
      size: 160,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="outline" size="sm" aria-label={`Open guideline: ${row.original.title}`} onClick={() => onView(row.original)}>Open<Eye className="ml-1 size-3.5" aria-hidden="true" /></Button>
          {(canUpdate || canNotify || canDelete) && <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`More actions for ${row.original.title}`}><MoreHorizontal className="size-4" aria-hidden="true" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end">
            {canUpdate && <>
              <DropdownMenuItem onSelect={() => onEdit(row.original)}><Pencil className="mr-2 size-4" aria-hidden="true" />Edit details</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onNewVersion(row.original)}><FilePlus2 className="mr-2 size-4" aria-hidden="true" />Create version</DropdownMenuItem>
              <DropdownMenuItem disabled={!getDocumentLatestVersion(row.original)} onSelect={() => onUpload(row.original)}>{isPublishedAsLink(row.original) ? <Link2 className="mr-2 size-4" aria-hidden="true" /> : <Upload className="mr-2 size-4" aria-hidden="true" />}{isPublishedAsLink(row.original) ? "Set link" : "Upload source"}</DropdownMenuItem>
            </>}
            {canNotify && <DropdownMenuItem disabled={!isDocumentPublished(row.original)} onSelect={() => onNotify(row.original)}><BellPlus className="mr-2 size-4" aria-hidden="true" />Create notification campaign</DropdownMenuItem>}
            {canDelete && <><DropdownMenuSeparator /><DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => onDelete(row.original)}><Trash2 className="mr-2 size-4" aria-hidden="true" />Delete guideline</DropdownMenuItem></>}
          </DropdownMenuContent></DropdownMenu>}
          {canPublish && <GuidelinePublicationAction document={row.original} onChanged={onChanged} />}
        </div>
      ),
    },
  ]
}
