"use client";

import * as React from "react";
import type { OutbreakListQuery, PagedResult } from "@/services/outbreaks.service";

/** Debounce typing and discard responses for filters the user has already changed. */
export function useOutbreakList<T>(
  fetchPage: (query: OutbreakListQuery) => Promise<PagedResult<T>>,
  query: OutbreakListQuery,
) {
  const [revision, setRevision] = React.useState(0);
  const requestKey = JSON.stringify([query, revision]);
  const [result, setResult] = React.useState<{
    key: string; items: T[]; total: number; pages: number; error: string; loading: boolean;
  }>({ key: "", items: [], total: 0, pages: 0, error: "", loading: true });

  React.useEffect(() => {
    let cancelled = false;
    const [requestQuery] = JSON.parse(requestKey) as [OutbreakListQuery, number];
    const timer = setTimeout(() => {
      setResult((current) => ({ ...current, key: requestKey, error: "", loading: true }));
      void fetchPage(requestQuery).then((value) => {
        if (!cancelled) setResult({ key: requestKey, items: value.items || [], total: value.total_items || 0, pages: value.total_pages || 0, error: "", loading: false });
      }).catch((error: unknown) => {
        if (!cancelled) setResult({ key: requestKey, items: [], total: 0, pages: 0, error: error instanceof Error ? error.message : "Unable to load records. Please try again.", loading: false });
      });
    }, requestQuery.search ? 250 : 0);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [fetchPage, requestKey]);

  const refresh = React.useCallback(() => setRevision((value) => value + 1), []);
  const loading = result.loading || result.key !== requestKey;
  return { ...result, items: loading ? [] : result.items, error: loading ? "" : result.error, loading, refresh };
}
