import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, expect, it, vi } from "vitest"
const send=vi.hoisted(()=>vi.fn())
vi.mock("@/lib/backend-client",()=>({getBackendClient:()=>({send})}))
import AccountAnalyticsPage from "./page"
afterEach(()=>{cleanup();vi.clearAllMocks()})
it("shows an empty queue and zero counts without inventing historical registrations",async()=>{
 send.mockResolvedValue({since:"2026-10-01",events:[],email_queue:[]})
 render(<AccountAnalyticsPage/>);
 expect(await screen.findByText("No account emails have been queued yet.")).toBeInTheDocument()
 expect(screen.getAllByText("0")).toHaveLength(10)
 expect(send).toHaveBeenCalledWith("/api/v2/analytics/accounts",{query:{days:30}})
})
it("allows recovery from analytics errors",async()=>{
 send.mockRejectedValueOnce(new Error("unavailable")).mockResolvedValueOnce({since:"2026-10-01",events:[],email_queue:[{status:"pending",count:2}]})
 render(<AccountAnalyticsPage/>);
 expect(await screen.findByText(/Unable to load account analytics/)).toBeInTheDocument()
 await userEvent.click(screen.getByRole("button",{name:"Refresh"}))
 expect(await screen.findByText("Pending")).toBeInTheDocument()
})

it("requests the selected period and labels email records as all time", async () => {
 send.mockResolvedValue({since:"2026-10-01",events:[{event:"user.account_created",count:12}],email_queue:[{status:"sent",count:48}]})
 render(<AccountAnalyticsPage />)
 expect(await screen.findByText("12")).toBeInTheDocument()
 expect(screen.getByText("Accepted by provider")).toBeInTheDocument()
 expect(screen.getByText(/across all time/)).toBeInTheDocument()
 await userEvent.selectOptions(screen.getByRole("combobox",{name:"Event period"}),"7")
 expect(await screen.findByText("12")).toBeInTheDocument()
 expect(send).toHaveBeenLastCalledWith("/api/v2/analytics/accounts",{query:{days:7}})
})
it("ignores a stale period response when a newer period finishes first", async () => {
 let resolveOld!: (value: unknown) => void
 send.mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve }))
 send.mockResolvedValueOnce({since:"2026-10-20",events:[{event:"user.account_created",count:7}],email_queue:[]})
 render(<AccountAnalyticsPage />)
 await userEvent.selectOptions(screen.getByRole("combobox",{name:"Event period"}),"7")
 expect(await screen.findByText("7")).toBeInTheDocument()
 const { act } = await import("@testing-library/react")
 await act(async () => { resolveOld({since:"2026-10-01",events:[{event:"user.account_created",count:99}],email_queue:[]}) })
 expect(screen.queryByText("99")).not.toBeInTheDocument()
 expect(screen.getByText("7")).toBeInTheDocument()
})
