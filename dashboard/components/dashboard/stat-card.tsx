"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

type StatCardProps = {
  title: string
  value: string | number
  helper?: string
  icon?: LucideIcon
  iconTone?: string
}

export function StatCard({
  title,
  value,
  helper,
  icon: Icon,
  iconTone = "text-muted-foreground",
}: StatCardProps) {
  return (
    <Card className="min-w-0 gap-3 rounded-xl shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon ? <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted/70"><Icon className={`size-5 ${iconTone}`} aria-hidden="true" /></span> : null}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tracking-tight tabular-nums">
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
        {helper ? <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{helper}</p> : null}
      </CardContent>
    </Card>
  )
}
