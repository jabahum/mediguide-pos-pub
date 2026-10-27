import { dashboardPath } from "@/lib/create-dialog";

export type DashboardCrumb = { label: string; href: string };

// Only real dashboard routes are linked. Intermediate IDs without a page
// (for example guideline version IDs) never become broken breadcrumb links.
const routes: ReadonlyArray<readonly [string, string]> = [
  ["/guidelines", "Clinical Guidelines"],
  ["/guidelines/categories", "Categories"],
  ["/guidelines/tags", "Tags"],
  ["/guidelines/index", "Content index"],
  ["/guidelines/abbreviations", "Abbreviations"],
  ["/guidelines/document-kinds", "Document kinds"],
  ["/guidelines/:id", "Guideline details"],
  ["/guidelines/:id/edit", "Edit guideline"],
  ["/guidelines/:id/versions/:version/review", "Editorial review"],
  ["/guidelines/:id/versions/:version/markdown", "Markdown editor"],
  ["/diseases", "Diseases & Conditions"],
  ["/content-hubs", "Content Hubs"],
  ["/content-hubs/:id", "Hub details"],
  ["/drugs", "Drug Index"],
  ["/drugs/categories", "Categories"],
  ["/drugs/tags", "Tags"],
  ["/drugs/interactions", "Interactions"],
  ["/drugs/:id", "Drug details"],
  ["/drugs/:id/edit", "Edit drug"],
  ["/outbreaks", "Outbreak Management"],
  ["/outbreaks/resources", "Outbreak resources"],
  ["/outbreaks/:id", "Outbreak details"],
  ["/situation-reports", "Situation reports"],
  ["/situation-reports/:id", "Report details"],
  ["/decision-tools", "Decision Tools"],
  ["/decision-tools/calculators", "Run tools"],
  ["/decision-tools/categories", "Categories"],
  ["/decision-tools/review", "Clinical review"],
  ["/decision-tools/:id", "Tool details"],
  ["/decision-tools/:id/edit", "Edit tool"],
  ["/decision-tools/:id/author", "Author definition"],
  ["/decision-tools/:id/test", "Test tool"],
  ["/decision-tools/:id/review/:version", "Clinical review"],
  ["/users", "User Management"],
  ["/users/roles", "Roles & permissions"],
  ["/users/roles/:id/permissions", "Role permissions"],
  ["/users/:id", "User details"],
  ["/users/:id/edit", "Edit user"],
  ["/health-facilities", "Health Facilities"],
  ["/health-facilities/regions", "Regions"],
  ["/health-facilities/health-sub-regions", "Health sub-regions"],
  ["/health-facilities/districts", "Districts"],
  ["/health-facilities/counties", "Counties"],
  ["/health-facilities/health-sub-districts", "Health sub-districts"],
  ["/health-facilities/subcounties", "Subcounties"],
  ["/health-facilities/parishes", "Parishes"],
  ["/health-facilities/facility-levels", "Facility levels"],
  ["/health-facilities/ownership-types", "Ownership types"],
  ["/health-facilities/authorities", "Authorities"],
  ["/health-facilities/:id", "Facility details"],
  ["/health-facilities/:id/edit", "Edit facility"],
  ["/support", "Support"],
  ["/support/documentation", "Documentation"],
  ["/support/documentation/:id", "Document details"],
  ["/support/documentation/:id/edit", "Edit documentation"],
  ["/support/faqs", "FAQs"],
  ["/support/faqs/tags", "FAQ tags"],
  ["/support/faqs/tags/:id/edit", "Edit FAQ tag"],
  ["/support/faqs/:id", "FAQ details"],
  ["/support/faqs/:id/edit", "Edit FAQ"],
  ["/support/:id", "Ticket details"],
  ["/settings", "Settings"],
  ["/settings/notifications", "Notifications"],
  ["/settings/firebase", "Firebase"],
  ["/analytics/accounts", "Account Analytics"],
  ["/notifications", "Notifications"],
  ["/profile", "Profile"],
  ["/pages", "Pages"],
  ["/pages/:id", "Page details"],
  ["/pages/:id/edit", "Edit page"],
  ["/lab-test-menu", "Lab test menu"],
  ["/emergency-protocols", "Emergency protocols"],
  ["/emergency-protocols/resuscitation", "Resuscitation"],
  ["/emergency-protocols/trauma", "Trauma"],
  ["/emergency-protocols/:id", "Protocol details"],
  ["/emergency-protocols/:id/edit", "Edit protocol"],
];
const staticPaths = new Set(routes.filter(([path]) => !path.includes(":")).map(([path]) => path));

export function dashboardBreadcrumbs(pathname: string): DashboardCrumb[] {
  const path = dashboardPath(pathname).split("?")[0].replace(/\/+$/, "") || "/";
  if (path === "/") return [{ label: "Overview", href: "/" }];
  if (/^\/generic-pages\/[^/]+\/content\/edit$/.test(path)) return [{ label: "Pages", href: "/pages" }, { label: "Edit page content", href: path }];
  const segments = path.split("/").filter(Boolean);
  const crumbs = routes.flatMap(([pattern, label]) => {
    const parts = pattern.split("/").filter(Boolean);
    if (parts.length > segments.length) return [];
    const matches = parts.every((part, index) => part.startsWith(":")
      ? !staticPaths.has(`/${segments.slice(0, index + 1).join("/")}`)
      : part === segments[index]);
    return matches ? [{ label, href: `/${segments.slice(0, parts.length).join("/")}` }] : [];
  }).sort((a, b) => a.href.split("/").length - b.href.split("/").length);
  if (segments[0] === "situation-reports") crumbs.unshift({ label: "Outbreak Management", href: "/outbreaks" });
  if (crumbs.at(-1)?.href !== path) crumbs.push({ label: "Page", href: path });
  return crumbs;
}
