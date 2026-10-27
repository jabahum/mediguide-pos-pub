import { dashboardBasePath } from "@/lib/dashboard-path";

export const createForms = {
  "content-hubs": { path: "/content-hubs/new", title: "New content hub", parent: "/content-hubs" },
  "decision-tools": { path: "/decision-tools/create", title: "Create decision tool", parent: "/decision-tools" },
  drugs: { path: "/drugs/create", title: "Add drug", parent: "/drugs" },
  "emergency-protocols": { path: "/emergency-protocols/create", title: "Create emergency protocol", parent: "/emergency-protocols" },
  guidelines: { path: "/guidelines/create", title: "Create guideline", parent: "/guidelines" },
  "health-facilities": { path: "/health-facilities/create", title: "Add health facility", parent: "/health-facilities" },
  outbreaks: { path: "/outbreaks/new", title: "New outbreak", parent: "/outbreaks" },
  pages: { path: "/pages/create", title: "Create page", parent: "/pages" },
  "situation-reports": { path: "/situation-reports/new", title: "New situation report", parent: "/situation-reports" },
  documentation: { path: "/support/documentation/create", title: "Create documentation", parent: "/support/documentation" },
  faqs: { path: "/support/faqs/create", title: "Create FAQ", parent: "/support/faqs" },
  "faq-tags": { path: "/support/faqs/tags/create", title: "Create FAQ tag", parent: "/support/faqs/tags" },
  users: { path: "/users/create", title: "Create user", parent: "/users" },
} as const;

export function dashboardPath(pathname: string) {
  return dashboardBasePath && (pathname === dashboardBasePath || pathname.startsWith(`${dashboardBasePath}/`))
    ? pathname.slice(dashboardBasePath.length) || "/" : pathname;
}

export function resolveCreateForm(href: string) {
  if (!href.startsWith("/") || href.startsWith("//")) return null;
  const url = new URL(href, "https://dashboard.invalid");
  const pathname = dashboardPath(url.pathname).replace(/\/$/, "");
  for (const [id, form] of Object.entries(createForms)) {
    if (pathname === form.path) return { id: id as keyof typeof createForms | "page-content", ...form, query: url.search, pageKey: "" };
  }
  const match = pathname.match(/^\/generic-pages\/([^/]+)\/content\/create$/);
  if (!match) return null;
  return { id: "page-content" as const, path: pathname, title: "Create page content", parent: "/pages", query: url.search, pageKey: decodeURIComponent(match[1]) };
}
export type CreateFormRequest = NonNullable<ReturnType<typeof resolveCreateForm>>;
