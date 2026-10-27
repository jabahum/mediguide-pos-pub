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
  ChevronRight,
} from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { usePermissionContext } from "@/lib/permission-context"
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
    for (const url of [item.url, ...(item.activePaths || []), ...(item.items?.map(child => child.url) || [])]) {
      if (matchesNavigationPath(pathname, url) && url.length > longestMatch) {
        activeIndex = index
        longestMatch = url.length
      }
    }
  })
  return activeIndex
}

type NavSubItem = {
  title: string
  url: string
  permission?: { resource: string; action: PermissionAction }
  backendPermissions?: string[]
}

type NavItem = {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
  permission?: { resource: string; action: PermissionAction }
  backendPermissions?: string[]
  activePaths?: string[]
  items?: NavSubItem[]
}

// MediGuide navigation data
const data: { navMain: NavItem[] } = {
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      activePaths: ["/analytics/accounts"],
      icon: BarChart3,

    },
    {
      title: "Clinical Guidelines",
      url: "/guidelines",
      icon: FileText,
      permission: { resource: "content", action: "read:any" },
    },
    {
      title: "Diseases",
      url: "/diseases",
      icon: Stethoscope,
      permission: { resource: "content", action: "read:any" },
      backendPermissions: ["disease.taxonomy.read", "disease.taxonomy.manage"],
    },
    {
      title: "Content Hubs",
      url: "/content-hubs",
      icon: Layers,
      permission: { resource: "content", action: "read:any" },
      backendPermissions: ["content_hub.read", "content_hub.manage"],
    },
    {
      title: "Drug Index",
      url: "/drugs",
      icon: Pill,
      permission: { resource: "content", action: "read:any" },
    },
    {
      title: "Outbreak Management",
      url: "#",
      icon: Activity,
      backendPermissions: ["outbreak.read", "situation_report.read"],
      items: [
        { title: "Outbreaks", url: "/outbreaks", backendPermissions: ["outbreak.read"] },
        { title: "Situation Reports", url: "/situation-reports", backendPermissions: ["situation_report.read"] },
        { title: "Outbreak Resources", url: "/outbreaks/resources", backendPermissions: ["outbreak.read"] },
      ],
    },
    {
      title: "Decision Tools",
      url: "/decision-tools",
      icon: Calculator,
      permission: { resource: "content", action: "read:any" },
    },
    {
      title: "User Management",
      url: "/users",
      icon: Users,
      permission: { resource: "users", action: "read:any" },
    },
    {
      title: "Health Facilities",
      url: "/health-facilities",
      icon: Building2,
      permission: { resource: "content", action: "read:any" },
    },
    {
      title: "Support",
      url: "/support",
      icon: HeadphonesIcon,
      permission: { resource: "content", action: "read:any" },
    },
    {
      title: "Settings",
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
      .map(item => ({
        ...item,
        items: item.items?.filter(sub =>
          (!sub.permission || hasPermission(sub.permission.resource, sub.permission.action)) &&
          (!sub.backendPermissions || sub.backendPermissions.some(hasBackendPermission)),
        ),
      }))
      .filter(item => item.url !== "#" || !item.items || item.items.length > 0)
  }, [loading, hasPermission])

  // Find which menu item should be active/open based on current pathname
  const activeMenuIndex = findActiveMenuItem(pathname, visibleNav)

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
        <SidebarGroup>
          <SidebarMenu>
            {visibleNav?.map((item, index) => {
              // If item has no subitems and a direct URL, render as direct link
              if (!item.items?.length && item.url !== "#") {
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={activeMenuIndex === index}>
                      <Link href={item.url} aria-current={activeMenuIndex === index ? "page" : undefined}>
                        <item.icon className="mr-2 size-4" />
                        {item.title}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              }

              const activeChild = item.items
                ?.filter(child => matchesNavigationPath(pathname, child.url))
                .sort((left, right) => right.url.length - left.url.length)[0]
              // Keep untabbed destinations accessible through their submenu.
              return (
                <Collapsible
                  key={`${item.title}-${pathname}`}
                  defaultOpen={activeMenuIndex === index}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton isActive={activeMenuIndex === index}>
                        <item.icon className="mr-2 size-4" />
                        {item.title}
                        <ChevronRight aria-hidden="true" className="ml-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    {item.items?.length ? (
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={activeChild?.url === subItem.url}
                              >
                                <Link href={subItem.url} aria-current={activeChild?.url === subItem.url ? "page" : undefined}>{subItem.title}</Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    ) : null}
                  </SidebarMenuItem>
                </Collapsible>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
