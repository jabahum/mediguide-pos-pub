import type { OverviewSeriesPoint } from "@/types/overview"

// Join by date: independent series can omit different days.
export function mergeOverviewSeries(users: OverviewSeriesPoint[], drugs: OverviewSeriesPoint[], facilities: OverviewSeriesPoint[]) {
  const days = new Map<string, { day: string; users: number; drugs: number; facilities: number }>()
  for (const [key, points] of [["users", users], ["drugs", drugs], ["facilities", facilities]] as const) {
    for (const point of points) {
      const row = days.get(point.day) ?? { day: point.day, users: 0, drugs: 0, facilities: 0 }
      row[key] += point.total
      days.set(point.day, row)
    }
  }
  return Array.from(days.values()).sort((a, b) => a.day.localeCompare(b.day))
}
