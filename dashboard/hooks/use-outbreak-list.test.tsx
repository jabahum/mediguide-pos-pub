import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { useOutbreakList } from "./use-outbreak-list";
import type { OutbreakListQuery, PagedResult } from "@/services/outbreaks.service";

afterEach(() => { cleanup(); vi.useRealTimers(); });
const page = (title: string): PagedResult<{ title: string }> => ({ items: [{ title }], total_items: 1, total_pages: 1, page: 1, per_page: 20 });

test("ignores an older response after the user changes filters", async () => {
  let resolveOld!: (value: PagedResult<{ title: string }>) => void;
  const old = new Promise<PagedResult<{ title: string }>>((resolve) => { resolveOld = resolve; });
  const fetchPage = vi.fn().mockReturnValueOnce(old).mockResolvedValueOnce(page("Current"));
  const { result, rerender } = renderHook(({ query }: { query: OutbreakListQuery }) => useOutbreakList(fetchPage, query), { initialProps: { query: {} } });
  await waitFor(() => expect(fetchPage).toHaveBeenCalledTimes(1));
  rerender({ query: { status: "published" } });
  await waitFor(() => expect(result.current.items).toEqual([{ title: "Current" }]));
  await act(async () => { resolveOld(page("Stale")); });
  expect(result.current.items).toEqual([{ title: "Current" }]);
});

test("debounces typing and requests only the final search", async () => {
  vi.useFakeTimers();
  const fetchPage = vi.fn().mockResolvedValue(page("Found"));
  const { result, rerender } = renderHook(({ search }) => useOutbreakList(fetchPage, { search }), { initialProps: { search: "ch" } });
  await act(async () => { vi.advanceTimersByTime(150); });
  rerender({ search: "cholera" });
  await act(async () => { vi.advanceTimersByTime(249); });
  expect(fetchPage).not.toHaveBeenCalled();
  await act(async () => { vi.advanceTimersByTime(1); });
  expect(fetchPage).toHaveBeenCalledExactlyOnceWith({ search: "cholera" });
  expect(result.current.items).toEqual([{ title: "Found" }]);
});

test("hides previous records during refresh and recovers from a failed request", async () => {
  const fetchPage = vi.fn().mockRejectedValueOnce(new Error("Connection failed")).mockResolvedValueOnce(page("Recovered"));
  const { result } = renderHook(() => useOutbreakList(fetchPage, {}));
  await waitFor(() => expect(result.current.error).toBe("Connection failed"));
  act(() => result.current.refresh());
  expect(result.current.loading).toBe(true);
  expect(result.current.error).toBe("");
  await waitFor(() => expect(result.current.items).toEqual([{ title: "Recovered" }]));
});
