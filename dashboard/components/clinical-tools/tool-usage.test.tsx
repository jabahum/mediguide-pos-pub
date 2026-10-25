import { cleanup, render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ToolUsage } from "./tool-usage"
import { calculatorService } from "@/services/calculator.service"
import { hasBackendPermission } from "@/lib/backend-client"

vi.mock("@/services/calculator.service", () => ({ calculatorService: { usage: vi.fn() } }))
vi.mock("@/lib/backend-client", () => ({ hasBackendPermission: vi.fn() }))

function show(toolId = "tool-1") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={client}><ToolUsage toolId={toolId} /></QueryClientProvider>)
}

beforeEach(() => vi.mocked(hasBackendPermission).mockReturnValue(true))
afterEach(() => { cleanup(); vi.resetAllMocks() })

describe("ToolUsage", () => {
  it("loads statistics for the selected tool and explains their meaning", async () => {
    vi.mocked(calculatorService.usage).mockResolvedValue({
      total_sessions: 12, unique_users: 4, ended_sessions: 9, recent_sessions: 5,
      since: "2026-09-26", until: "2026-10-25", daily: [{ date: "2026-10-25", sessions: 3 }],
    })
    show()
    expect(await screen.findByText("12")).toBeInTheDocument()
    expect(calculatorService.usage).toHaveBeenCalledWith("tool-1")
    expect(screen.getByText("4")).toBeInTheDocument()
    expect(screen.getByText("2026-10-25")).toBeInTheDocument()
    expect(screen.getByText(/not that an assessment was completed/)).toBeInTheDocument()
  })

  it("shows a real empty state", async () => {
    vi.mocked(calculatorService.usage).mockResolvedValue({ total_sessions: 0, daily: [] })
    show()
    expect(await screen.findByText(/No synced usage sessions/)).toBeInTheDocument()
  })

  it("shows errors rather than presenting failed requests as zero usage", async () => {
    vi.mocked(calculatorService.usage).mockRejectedValue(new Error("unavailable"))
    show()
    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to load tool usage")
    expect(screen.queryByText("Total sessions")).not.toBeInTheDocument()
  })

  it("does not request analytics without permission", async () => {
    vi.mocked(hasBackendPermission).mockReturnValue(false)
    show()
    expect(screen.getByText(/Analytics permission is required/)).toBeInTheDocument()
    await waitFor(() => expect(calculatorService.usage).not.toHaveBeenCalled())
  })
})
