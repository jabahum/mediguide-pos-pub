export const outbreakNavigationItems = [
  { id: "outbreaks", href: "/outbreaks", label: "Outbreaks", permission: "outbreak.read" },
  { id: "reports", href: "/situation-reports", label: "Situation reports", permission: "situation_report.read" },
  { id: "resources", href: "/outbreaks/resources", label: "Outbreak resources", permission: "outbreak.read" },
] as const

export type OutbreakSection = typeof outbreakNavigationItems[number]["id"]

export function outbreakLandingPath(hasPermission: (permission: string) => boolean) {
  return hasPermission("outbreak.read") ? "/outbreaks" : "/situation-reports"
}
