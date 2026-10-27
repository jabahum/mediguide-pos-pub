"use client";

import type { Table } from "@tanstack/react-table";
import { TablePagination } from "@/components/ui/table-pagination";
import type { DataTablePaginationProps } from "@/types/data-table";

interface DataTablePaginationComponentProps<TData> extends DataTablePaginationProps {
  table: Table<TData>;
  showSelection?: boolean;
  appearance?: "default" | "workspace";
}

export function DataTablePagination<TData>({ table, paginationInfo, pageSizeOptions, onPageChange, onPageSizeChange, loading = false, showSelection = true }: DataTablePaginationComponentProps<TData>) {
  const selected = table.getFilteredSelectedRowModel().rows.length;
  return <TablePagination page={paginationInfo.page} pageSize={paginationInfo.perPage} totalItems={paginationInfo.totalItems} totalPages={paginationInfo.totalPages} loading={loading} pageSizeOptions={pageSizeOptions} onPageChange={page => onPageChange?.(page)} onPageSizeChange={onPageSizeChange} selection={showSelection && selected > 0 ? <span className="text-xs text-muted-foreground">{selected} selected</span> : undefined} />;
}

// Keep existing consumers on the same responsive pagination layout.
export const DataTablePaginationCompact = DataTablePagination;
