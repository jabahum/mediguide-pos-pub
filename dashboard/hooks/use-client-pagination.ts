"use client";

import * as React from "react";

export type Pagination<T> = {
  visible: T[];
  /** Index of the first visible item in the full list. */
  offset: number;
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
  setPage: (page: number) => void;
  setPageSize?: (size: number) => void;
  /** Moves to the page that holds the item at this index of the full list. */
  showIndex: (index: number) => void;
};

/** Client-side paging with the shared table controls. */
export function usePagination<T>(items: T[], pageSize?: number): Pagination<T> {
  const [page, setPage] = React.useState(1);
  const [size, setSize] = React.useState(pageSize && pageSize > 0 ? pageSize : 20);
  const pageCount = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(page, pageCount);
  const offset = (current - 1) * size;
  return {
    visible: items.slice(offset, offset + size),
    offset,
    page: current,
    pageCount,
    pageSize: size,
    total: items.length,
    setPage,
    setPageSize: (value) => { setSize(value); setPage(1); },
    showIndex: (index) => setPage(Math.floor(index / size) + 1),
  };
}
