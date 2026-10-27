"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ReactNode } from "react"

type ChartCardProps = {
  title: string
  children: ReactNode
  description?: string
}

export function ChartCard({ title, children, description }: ChartCardProps) {
  return (
    <Card className="h-full min-w-0 rounded-xl shadow-xs">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <p className="text-sm leading-6 text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent className="min-w-0">{children}</CardContent>
    </Card>
  )
}
