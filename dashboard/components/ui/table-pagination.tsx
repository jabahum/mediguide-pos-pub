"use client";

import { useId, type ReactNode } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface TablePaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages?: number;
  count?: number;
  loading?: boolean;
  label?: string;
  pageSizeOptions?: number[];
  selection?: ReactNode;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  className?: string;
}

export function TablePagination({ page, pageSize, totalItems, totalPages, count, loading = false, label = "Table pagination", pageSizeOptions = [10, 20, 50, 100], selection, onPageChange, onPageSizeChange, className }: TablePaginationProps) {
  const id = useId();
  const pages = Math.max(1, totalPages ?? Math.ceil(totalItems / pageSize));
  const current = Math.max(1, Math.min(page, pages));
  const start = totalItems === 0 || count === 0 ? 0 : (current - 1) * pageSize + 1;
  const end = start === 0 ? 0 : Math.min(totalItems, (current - 1) * pageSize + (count ?? pageSize));
  const sizes = [...new Set([...pageSizeOptions, pageSize])].sort((a, b) => a - b);
  return <nav aria-label={label} aria-busy={loading} className={cn("@container rounded-xl border bg-card p-4", className)}>
    <div className="grid grid-cols-1 items-center gap-3 @min-[640px]:grid-cols-[1fr_auto_1fr]">
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <label className="whitespace-nowrap font-medium" htmlFor={id}>Rows per page</label>
      <div className="relative"><select id={id} className="h-9 w-[70px] appearance-none rounded-lg border border-input bg-background pl-3 pr-7 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50" value={pageSize} disabled={loading || !onPageSizeChange} onChange={event => onPageSizeChange?.(Number(event.target.value))}>{sizes.map(size => <option key={size} value={size}>{size}</option>)}</select><ChevronDown className="pointer-events-none absolute right-2 top-3 size-3.5 text-muted-foreground" aria-hidden="true" /></div>
      {selection}
    </div>
    <p className="text-center text-sm text-muted-foreground" aria-live="polite">Showing {start.toLocaleString()} to {end.toLocaleString()} of {totalItems.toLocaleString()} results</p>
    <div className="flex items-center justify-center gap-2 @min-[640px]:justify-end">
      <span className="sr-only">Page {current} of {pages}</span>
      {[
        { name: "First page", title: "Go to first page", icon: ChevronsLeft, target: 1, disabled: current <= 1 },
        { name: "Previous", title: "Go to previous page", icon: ChevronLeft, target: current - 1, disabled: current <= 1 },
        { name: "Next", title: "Go to next page", icon: ChevronRight, target: current + 1, disabled: current >= pages },
        { name: "Last page", title: "Go to last page", icon: ChevronsRight, target: pages, disabled: current >= pages },
      ].map(({ name, title, icon: Icon, target, disabled }) => <Button key={name} type="button" variant="outline" size="icon" className="size-8 rounded-lg" aria-label={name} title={title} disabled={loading || disabled || totalItems === 0} onClick={() => onPageChange(target)}><Icon className="size-4" aria-hidden="true" /></Button>)}
    </div>
    </div>
  </nav>;
}
