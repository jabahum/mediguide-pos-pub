"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ChevronDown, Search, SearchX } from "lucide-react"
import { DataTablePagination } from "@/components/ui/datatable-pagination"
import { EmptyState } from "@/components/ui/empty-state"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { cn, snakeToTitleCase } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: keyof TData
  searchPlaceholder?: string
  tableClassName?: string
  appearance?: "default" | "workspace"
  toolbarContent?: React.ReactNode
  initialSorting?: SortingState
  recordLabel?: string
  tableLabel?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Filter...",
  tableClassName,
  appearance = "default",
  toolbarContent,
  initialSorting = [],
  tableLabel,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>(initialSorting)
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const table = useReactTable({
    data,
    columns,
    initialState: { pagination: { pageSize: 20 } },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className={cn("w-full min-w-0", appearance === "workspace" && "space-y-4")}>
      <div className={appearance === "workspace" ? "flex flex-wrap items-center justify-between gap-3" : "flex items-center py-4"}>
        {toolbarContent}
        {searchKey && (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={(table.getColumn(searchKey as string)?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn(searchKey as string)?.setFilterValue(event.target.value)
              }
              className="pl-8"
            />
          </div>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {appearance === "workspace" ? snakeToTitleCase(column.id) : column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className={cn("rounded-md border", appearance === "workspace" && "overflow-hidden rounded-xl bg-card shadow-xs")}>
        <Table className={tableClassName} aria-label={tableLabel}>
          <TableHeader className={appearance === "workspace" ? "bg-muted/40" : undefined}>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className={appearance === "workspace" ? "px-4 py-4" : undefined}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <EmptyState
                    icon={columnFilters.length ? SearchX : undefined}
                    title={columnFilters.length ? "No matching results" : "No records yet"}
                    description={columnFilters.length ? "Try another search or clear your filters." : "Records will appear here once they have been added."}
                    action={columnFilters.length ? { label: "Clear filters", onClick: () => table.resetColumnFilters() } : undefined}
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination
        table={table}
        paginationInfo={{ page: table.getState().pagination.pageIndex + 1, perPage: table.getState().pagination.pageSize, totalItems: table.getFilteredRowModel().rows.length, totalPages: table.getPageCount(), hasNextPage: table.getCanNextPage(), hasPreviousPage: table.getCanPreviousPage() }}
        onPageChange={page => table.setPageIndex(page - 1)}
        onPageSizeChange={size => { table.setPageSize(size); table.setPageIndex(0) }}
      />
    </div>
  )
}
