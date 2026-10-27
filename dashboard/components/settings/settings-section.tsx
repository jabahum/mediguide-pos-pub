"use client"

import { Bell, CloudCog, Settings } from "lucide-react"
import type { PageHeaderProps } from "@/components/ui/page-header"
import { WorkspaceSectionHeader } from "@/components/ui/workspace-section-header"
import { hasBackendPermission } from "@/lib/backend-client"

export const settingsSections = [
  { id: "notifications", href: "/settings/notifications", label: "Notifications", icon: Bell, description: "Manage notice templates, review campaigns, and monitor delivery activity.", permissions: ["notification.publish", "notification.template.read", "notification.campaign.read", "notification.analytics.read", "firebase.status.read"] },
  { id: "firebase", href: "/settings/firebase", label: "Firebase", icon: CloudCog, description: "Review channel health, manage mobile Remote Config, and test push notifications.", permissions: ["firebase.status.read", "firebase.config.manage", "firebase.push.test"] },
]
export function availableSettingsSections() {
  return settingsSections.filter(item => item.permissions.some(hasBackendPermission))
}
export function SettingsSectionHeader({ section = "overview", ...props }: PageHeaderProps & { section?: "overview" | "notifications" | "firebase" }) {
  return <WorkspaceSectionHeader {...props} eyebrow="SYSTEM CONFIGURATION" icon={settingsSections.find(item => item.id === section)?.icon || Settings} section={section} sections={[{ id: "overview", href: "/settings", label: "Settings overview", icon: Settings }, ...availableSettingsSections()]} navigationLabel="Settings sections" />
}
