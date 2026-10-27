import { expect, it } from "vitest"
import { mergeOverviewSeries } from "./overview-series"

it("joins independent series by date and fills missing days without moving counts", () => {
  expect(mergeOverviewSeries(
    [{ day: "2026-10-02", total: 3 }],
    [{ day: "2026-10-01", total: 7 }, { day: "2026-10-02", total: 2 }],
    [{ day: "2026-10-03", total: 5 }],
  )).toEqual([
    { day: "2026-10-01", users: 0, drugs: 7, facilities: 0 },
    { day: "2026-10-02", users: 3, drugs: 2, facilities: 0 },
    { day: "2026-10-03", users: 0, drugs: 0, facilities: 5 },
  ])
})
it("preserves drug and facility data even when there are no user records", () => {
  expect(mergeOverviewSeries([], [{ day: "2026-10-01", total: 4 }], [])).toEqual([{ day: "2026-10-01", users: 0, drugs: 4, facilities: 0 }])
  expect(mergeOverviewSeries([], [], [])).toEqual([])
})
