"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { dashboardBreadcrumbs } from "@/lib/dashboard-breadcrumbs";
import { hasBackendPermission } from "@/lib/backend-client";
import { outbreakLandingPath } from "@/lib/outbreak-navigation";

export function DashboardBreadcrumbs() {
  const pathname = usePathname();
  const crumbs = dashboardBreadcrumbs(pathname);
  return <Breadcrumb className="min-w-0 flex-1 overflow-x-auto" aria-label="Dashboard breadcrumb">
    <BreadcrumbList className="flex-nowrap whitespace-nowrap">
      <BreadcrumbItem className="hidden sm:inline-flex"><BreadcrumbLink asChild><Link href="/">MediGuide Dashboard</Link></BreadcrumbLink></BreadcrumbItem>
      {crumbs.map((crumb, index) => <Fragment key={crumb.href}>
        <BreadcrumbSeparator className={index === 0 ? "hidden sm:block" : undefined} />
        <BreadcrumbItem>{index === crumbs.length - 1 ? <BreadcrumbPage>{crumb.label}</BreadcrumbPage> : <BreadcrumbLink asChild><Link href={crumb.href === "/outbreaks" ? outbreakLandingPath(hasBackendPermission) : crumb.href}>{crumb.label}</Link></BreadcrumbLink>}</BreadcrumbItem>
      </Fragment>)}
    </BreadcrumbList>
  </Breadcrumb>;
}
