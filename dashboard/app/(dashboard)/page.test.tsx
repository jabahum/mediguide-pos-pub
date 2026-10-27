import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, expect, it, vi } from "vitest"
const { send, hasBackendPermission } = vi.hoisted(() => ({ send: vi.fn(), hasBackendPermission: vi.fn(() => false) }))
vi.mock("@/lib/backend-client", () => ({ getBackendClient: () => ({ send }), hasBackendPermission }))
vi.mock("@/components/dashboard/overview-charts", () => ({
 OverviewSeriesChart: () => <div>New record chart</div>,
 OverviewEngagementChart: () => <div>Interactions chart</div>,
 OverviewFeatureUsageChart: () => <div>Section visits chart</div>,
}))
import DashboardPage from "./page"
import type { OverviewData } from "@/types/overview"
const data: OverviewData = {
 success: true, cached_at: "2026-10-27T09:00:00Z",
 metrics: { totalUsers: 120, activeUsers: 80, healthcareProviders: 40, totalDrugs: 70, activeDrugs: 60, totalFacilities: 20 },
 pipeline: { usersPendingActivation: 5, drugsUnderReview: 3, drugsPendingReview: 4, drugsInactive: 6 },
 engagement: { aiUsage7d: 0, aiUsage30d: 0, calculatorUsage7d: 0, calculatorUsage30d: 0, guidelineUsage7d: 0, guidelineUsage30d: 0, drugUsage7d: 0, drugUsage30d: 0, facilityUsage7d: 0, facilityUsage30d: 0 },
 contentHealth: { medicalGuidelinesTotal: 10, medicalGuidelinesPublished: 8, medicalGuidelinesDraft: 2, faqsTotal: 5, faqsPublished: 4, faqsDraft: 1, documentationTotal: 3, documentationPublished: 2, genericPagesTotal: 0, abbreviationsTotal: 0, calculatorsTotal: 5, calculatorsActive: 3, guidelineCategoriesActive: 0 },
 support: { ticketsOpen: 1, ticketsInProgress: 2, ticketsResolved: 3, ticketsClosed: 4, ticketsUrgent: 1, notifications7d: 0, notifications30d: 0 },
 taxonomy: { activeDrugCategories: 0, activeDrugClasses: 0, activeTherapeuticCategories: 0, activeDrugTags: 0 },
 coverage: { regions: 4, districts: 12, subcounties: 15, parishes: 25 },
 series: { usersByDay: [], drugsByDay: [], facilitiesByDay: [] },
}
afterEach(() => { cleanup(); vi.resetAllMocks() })
it("replaces failed loading with an error and supports retry", async () => {
 send.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(data)
 render(<DashboardPage />)
 expect(await screen.findByText(/Unable to load the dashboard/)).toBeInTheDocument()
 expect(screen.queryByRole("status")).not.toBeInTheDocument()
 await userEvent.click(screen.getByRole("button", { name: "Refresh" }))
 expect(await screen.findByText("120")).toBeInTheDocument()
 expect(screen.getByText("80 accounts with active status")).toBeInTheDocument()
 expect(screen.getByText("Drugs pending review")).toBeInTheDocument()
 expect(screen.getByText("Across all ticket statuses")).toBeInTheDocument()
 expect(screen.getByText(/2 without a published edition/)).toBeInTheDocument()
 expect(screen.queryByRole("link", { name: /Account analytics/ })).not.toBeInTheDocument()
})
it("shows the analytics shortcut to authorized users", async () => {
 hasBackendPermission.mockReturnValue(true)
 send.mockResolvedValue(data)
 render(<DashboardPage />)
 expect(await screen.findByText("120")).toBeInTheDocument()
 expect(screen.getByRole("link", { name: /Account analytics/ })).toHaveAttribute("href", "/analytics/accounts")
})
it("treats an unsuccessful overview response as an error", async () => {
 send.mockResolvedValue({ success: false })
 render(<DashboardPage />)
 expect(await screen.findByText(/Unable to load the dashboard/)).toBeInTheDocument()
})
