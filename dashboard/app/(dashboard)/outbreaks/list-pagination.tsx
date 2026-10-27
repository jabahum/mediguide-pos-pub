"use client";

import { TablePagination } from "@/components/ui/table-pagination";
import type { Pagination } from "@/hooks/use-client-pagination";
export { usePagination, type Pagination } from "@/hooks/use-client-pagination";
export const DEFAULT_PAGE_SIZE = 5;

export function PaginationControls<T>({ pagination, label, loading = false }: { pagination: Pagination<T>; label: string; loading?: boolean }) {
  return <TablePagination label={`${label} pages`} page={pagination.page} pageSize={pagination.pageSize} totalItems={pagination.total} totalPages={pagination.pageCount} count={pagination.visible.length} loading={loading} onPageChange={pagination.setPage} onPageSizeChange={pagination.setPageSize} />;
}
