"use client"

import * as React from "react"
import { Table } from "@tanstack/react-table"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DataTablePaginationProps } from "@/types/data-table"
import { cn } from "@/lib/utils"

interface DataTablePaginationComponentProps<TData>
  extends DataTablePaginationProps {
  table: Table<TData>
  showSelection?: boolean
  appearance?: "default" | "workspace"
}

export function DataTablePagination<TData>({
  appearance = "default",
  table,
  paginationInfo,
  pageSizeOptions = [10, 20, 50, 100],
  onPageChange,
  onPageSizeChange,
  loading = false,
  showSelection = true,
}: DataTablePaginationComponentProps<TData>) {
  const [jumpToPage, setJumpToPage] = React.useState("")

  const {
    page,
    perPage,
    totalItems,
    totalPages,
    hasNextPage,
    hasPreviousPage,
  } = paginationInfo

  const handlePageSizeChange = (value: string) => {
    const newPageSize = Number(value)
    onPageSizeChange?.(newPageSize)
  }

  const handleJumpToPage = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      const pageNumber = Number(jumpToPage)
      if (pageNumber >= 1 && pageNumber <= totalPages) {
        onPageChange?.(pageNumber)
        setJumpToPage("")
      }
    }
  }

  const handleFirstPage = () => {
    onPageChange?.(1)
  }

  const handlePreviousPage = () => {
    if (hasPreviousPage) {
      onPageChange?.(page - 1)
    }
  }

  const handleNextPage = () => {
    if (hasNextPage) {
      onPageChange?.(page + 1)
    }
  }

  const handleLastPage = () => {
    onPageChange?.(totalPages)
  }

  const getRowsDisplayText = () => {
    if (totalItems === 0) return "No results"

    const startRow = (page - 1) * perPage + 1
    const endRow = Math.min(page * perPage, totalItems)

    return `Showing ${startRow.toLocaleString()} to ${endRow.toLocaleString()} of ${totalItems.toLocaleString()} results`
  }

  const getSelectionText = () => {
    const selectedCount = table.getFilteredSelectedRowModel().rows.length
    const totalCount = table.getFilteredRowModel().rows.length

    if (selectedCount === 0) return ""
    if (selectedCount === totalCount) return `All ${totalCount} rows selected`
    return `${selectedCount} of ${totalCount} rows selected`
  }

  return (
    <div className={cn("flex items-center justify-between px-2 py-4", appearance === "workspace" && "flex-wrap gap-4 rounded-xl border bg-card p-4")}>
      {/* Left side - Selection info and rows per page */}
      <div className={appearance === "workspace" ? "flex flex-wrap items-center gap-4 text-sm" : "flex items-center space-x-6 text-sm"}>
        {/* Selection info */}
        {showSelection && (
          <div className="text-muted-foreground">
            {getSelectionText()}
          </div>
        )}

        {/* Rows per page */}
        <div className="flex items-center space-x-2">
          <Label htmlFor="page-size" className="text-sm font-medium">
            Rows per page
          </Label>
          <Select
            value={`${perPage}`}
            onValueChange={handlePageSizeChange}
            disabled={loading}
          >
            <SelectTrigger id="page-size" className="h-8 w-[70px]">
              <SelectValue placeholder={perPage} />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Center - Results info */}
      <div className="text-sm text-muted-foreground">
        {getRowsDisplayText()}
      </div>

      {/* Right side - Pagination controls */}
      <div className={appearance === "workspace" ? "flex flex-wrap items-center gap-4" : "flex items-center space-x-6 lg:space-x-8"}>
        {/* Jump to page */}
        {totalPages > 1 && (
          <div className="flex items-center space-x-2">
            <Label htmlFor="jump-to-page" className="text-sm font-medium">
              Page
            </Label>
            <Input
              id="jump-to-page"
              type="number"
              min={1}
              max={totalPages}
              placeholder={`${page}`}
              value={jumpToPage}
              onChange={(e) => setJumpToPage(e.target.value)}
              onKeyDown={handleJumpToPage}
              className="h-8 w-[60px] text-center"
              disabled={loading}
            />
            <span className="text-sm text-muted-foreground">
              of {totalPages}
            </span>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={handleFirstPage}
            disabled={!hasPreviousPage || loading}
            title="Go to first page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={handlePreviousPage}
            disabled={!hasPreviousPage || loading}
            title="Go to previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={handleNextPage}
            disabled={!hasNextPage || loading}
            title="Go to next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={handleLastPage}
            disabled={!hasNextPage || loading}
            title="Go to last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// Alternative compact pagination component for smaller screens
export function DataTablePaginationCompact<TData>({
  paginationInfo,
  onPageChange,
  onPageSizeChange,
  loading = false,
}: DataTablePaginationComponentProps<TData>) {
  const {
    page,
    perPage,
    totalItems,
    totalPages,
    hasNextPage,
    hasPreviousPage,
  } = paginationInfo

  const handlePageSizeChange = (value: string) => {
    const newPageSize = Number(value)
    onPageSizeChange?.(newPageSize)
  }

  return (
    <div className="flex items-center justify-between space-x-2 py-4">
      {/* Page size selector */}
      <div className="flex items-center space-x-2">
        <Select
          value={`${perPage}`}
          onValueChange={handlePageSizeChange}
          disabled={loading}
        >
          <SelectTrigger className="h-8 w-[70px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent side="top">
            {[10, 20, 50, 100].map((size) => (
              <SelectItem key={size} value={`${size}`}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">per page</span>
      </div>

      {/* Page info */}
      <div className="text-sm text-muted-foreground">
        Page {page} of {totalPages} ({totalItems} total)
      </div>

      {/* Navigation */}
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange?.(page - 1)}
          disabled={!hasPreviousPage || loading}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange?.(page + 1)}
          disabled={!hasNextPage || loading}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
