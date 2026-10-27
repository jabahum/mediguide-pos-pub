"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { withDashboardBasePath } from "@/lib/dashboard-path"
import {
  Activity,
  Users,
  FileText,
  Settings,
  BarChart3,
  Pill,
  Calculator,
  Building2,
  HeadphonesIcon,
  Layers,
  Stethoscope,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { usePermissionContext } from "@/lib/permission-context"
import { outbreakLandingPath } from "@/lib/outbreak-navigation"
import { hasBackendPermission } from "@/lib/backend-client"
import type { PermissionAction } from "@/types/permissions"

// Match whole route segments, so /users-other never activates /users.
function matchesNavigationPath(pathname: string, url: string) {
  return url !== "#" && (pathname === url || (url !== "/" && pathname.startsWith(`${url}/`)))
}

function findActiveMenuItem(pathname: string, navItems: NavItem[]) {
  let activeIndex = -1
  let longestMatch = -1
  navItems.forEach((item, index) => {
    for (const url of [item.url, ...(item.activePaths || [])]) {
      if (matchesNavigationPath(pathname, url) && url.length > longestMatch) {
        activeIndex = index
        longestMatch = url.length
      }
    }
  })
  return activeIndex
}

const navigationGroups = ["Overview", "Clinical Resources", "Operations", "Administration"] as const

type NavItem = {
  group: typeof navigationGroups[number]
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
  permission?: { resource: string; action: PermissionAction }
  backendPermissions?: string[]
  activePaths?: string[]
}

// MediGuide navigation data
const data: { navMain: NavItem[] } = {
  navMain: [
    {
      title: "Dashboard",
      group: "Overview",
      url: "/",
      activePaths: ["/analytics/accounts"],
      icon: BarChart3,
    },
    {
      title: "Clinical Guidelines",
      group: "Clinical Resources",
      url: "/guidelines",
      icon: FileText,
      permission: { resource: "content", action: "read:any" },
    },
    {
      title: "Diseases",
      group: "Clinical Resources",
      url: "/diseases",
      icon: Stethoscope,
      permission: { resource: "content", action: "read:any" },
      backendPermissions: ["disease.taxonomy.read", "disease.taxonomy.manage"],
    },
    {
      title: "Content Hubs",
      group: "Clinical Resources",
      url: "/content-hubs",
      icon: Layers,
      permission: { resource: "content", action: "read:any" },
      backendPermissions: ["content_hub.read", "content_hub.manage"],
    },
    {
      title: "Drug Index",
      group: "Clinical Resources",
      url: "/drugs",
      icon: Pill,
      permission: { resource: "content", action: "read:any" },
    },
    {
      title: "Outbreak Management",
      group: "Operations",
      url: "/outbreaks",
      activePaths: ["/outbreaks", "/situation-reports"],
      icon: Activity,
      backendPermissions: ["outbreak.read", "situation_report.read"],
    },
    {
      title: "Decision Tools",
      group: "Clinical Resources",
      url: "/decision-tools",
      icon: Calculator,
      permission: { resource: "content", action: "read:any" },
    },
    {
      title: "User Management",
      group: "Administration",
      url: "/users",
      icon: Users,
      permission: { resource: "users", action: "read:any" },
    },
    {
      title: "Health Facilities",
      group: "Operations",
      url: "/health-facilities",
      icon: Building2,
      permission: { resource: "content", action: "read:any" },
    },
    {
      title: "Support",
      group: "Administration",
      url: "/support",
      icon: HeadphonesIcon,
      permission: { resource: "content", action: "read:any" },
    },
    {
      title: "Settings",
      group: "Administration",
      url: "/settings",
      icon: Settings,
      backendPermissions: ["notification.publish", "notification.template.read", "notification.campaign.read", "notification.analytics.read", "firebase.status.read", "firebase.push.test", "firebase.config.manage"],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { hasPermission, loading } = usePermissionContext()

  const visibleNav = React.useMemo<NavItem[]>(() => {
    if (loading) return []
    return data.navMain
      .filter(item =>
        (!item.permission || hasPermission(item.permission.resource, item.permission.action)) &&
        (!item.backendPermissions || item.backendPermissions.some(hasBackendPermission)),
      )
      .map(item => item.url === "/outbreaks" ? { ...item, url: outbreakLandingPath(hasBackendPermission) } : item)
  }, [loading, hasPermission])

  // Resolve the active item before grouping to preserve longest route matching.
  const activeMenuItem = visibleNav[findActiveMenuItem(pathname, visibleNav)]

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center">
                  <Image
                    src={withDashboardBasePath("/coat_of_arms.png")}
                    alt="Uganda coat of arms"
                    width={32}
                    height={34}
                    className="h-8 w-auto object-contain"
                    priority
                  />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">MediGuide</span>
                  <span className="">Dashboard</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {navigationGroups.map(group => {
          const items = visibleNav.filter(item => item.group === group)
          if (!items.length) return null

          return (
            <SidebarGroup key={group} role="group" aria-label={group}>
              <SidebarGroupLabel>{group}</SidebarGroupLabel>
              <SidebarMenu>
                {items.map(item => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={activeMenuItem === item} tooltip={item.title}>
                      <Link href={item.url} aria-current={activeMenuItem === item ? "page" : undefined}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          )
        })}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
