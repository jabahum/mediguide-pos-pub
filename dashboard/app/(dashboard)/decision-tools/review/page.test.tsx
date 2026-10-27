import { act, cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, expect, it, vi } from "vitest"
import type { ClinicalToolReviewQueue, ClinicalToolReviewQueueItem } from "@/services/clinical-tool.service"
const reviewQueue = vi.hoisted(() => vi.fn())
vi.mock("@/services/clinical-tool.service", () => ({ clinicalToolService: { reviewQueue } }))
vi.mock("@/lib/backend-client", () => ({ hasBackendPermission: () => true }))
import ClinicalToolReviewQueuePage from "./page"

const item = {
  version_id: "version-1", calculator_id: "tool-1", tool_name: "Blood pressure assessment",
  tool_type: "calculator", tool_status: "active", tool_risk_level: "low", semantic_version: "1.0.0",
  version_status: "pending_review", validation_passed: true, tests_passed: false,
  fixture_count: 3, fixture_passed_count: 2, review_evidence_status: "missing",
} as ClinicalToolReviewQueueItem
const queue: ClinicalToolReviewQueue = { items: [item], page: 1, per_page: 20, total_items: 1, total_pages: 1 }
afterEach(() => { cleanup(); vi.resetAllMocks() })

it("shows validation, fixture and parity evidence with a direct review link", async () => {
  reviewQueue.mockResolvedValue(queue)
  render(<ClinicalToolReviewQueuePage />)
  expect(await screen.findByRole("link", { name: /Blood pressure assessment/ })).toHaveAttribute("href", "/decision-tools/tool-1/review/version-1")
  expect(screen.getByText("Validation passed")).toBeInTheDocument()
  expect(screen.getByText("2/3 fixtures · tests required")).toBeInTheDocument()
  expect(screen.getByText("Parity evidence: Missing")).toBeInTheDocument()
})
it("recovers from a failed request and gives an explicit empty result", async () => {
  reviewQueue.mockRejectedValueOnce(new Error("Service unavailable")).mockResolvedValueOnce({ ...queue, items: [], total_items: 0 })
  render(<ClinicalToolReviewQueuePage />)
  expect(await screen.findByRole("alert")).toHaveTextContent("Service unavailable")
  await userEvent.click(screen.getByRole("button", { name: "Try again" }))
  expect(await screen.findByText("No versions match these filters")).toBeInTheDocument()
  expect(screen.queryByText("Blood pressure assessment")).not.toBeInTheDocument()
})
it("resets pagination when changing filters and sends the chosen type", async () => {
  reviewQueue.mockResolvedValue({ ...queue, total_items: 30, total_pages: 2 })
  render(<ClinicalToolReviewQueuePage />)
  await screen.findByText("Blood pressure assessment")
  await userEvent.click(screen.getByRole("button", { name: "Next" }))
  await screen.findByText("Blood pressure assessment")
  expect(reviewQueue).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }))
  await userEvent.selectOptions(screen.getByLabelText("Tool type"), "checklist")
  await screen.findByText("Blood pressure assessment")
  expect(reviewQueue).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, type: "checklist" }))
  await userEvent.click(screen.getByRole("button", { name: "Reset filters" }))
  await screen.findByText("Blood pressure assessment")
  expect(reviewQueue).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, type: "", status: "pending_review", search: "" }))
})
it("ignores a stale response after the filters change", async () => {
  let resolveOld!: (value: ClinicalToolReviewQueue) => void
  reviewQueue.mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve }))
  reviewQueue.mockResolvedValueOnce({ ...queue, items: [{ ...item, tool_name: "Checklist result" }] })
  render(<ClinicalToolReviewQueuePage />)
  await userEvent.selectOptions(screen.getByLabelText("Tool type"), "checklist")
  expect(await screen.findByText("Checklist result")).toBeInTheDocument()
  await act(async () => { resolveOld(queue) })
  expect(screen.queryByText("Blood pressure assessment")).not.toBeInTheDocument()
  expect(screen.getByText("Checklist result")).toBeInTheDocument()
})
