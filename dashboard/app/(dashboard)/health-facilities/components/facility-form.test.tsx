import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, expect, it, vi } from "vitest"
import { facilityOptionsQueryKey } from "@/lib/facility-query-keys"
const mocks = vi.hoisted(() => ({ push: vi.fn(), levels: vi.fn(), authorities: vi.fn(), ownership: vi.fn(), regions: vi.fn(), subRegions: vi.fn(), districts: vi.fn(), counties: vi.fn(), subDistricts: vi.fn(), subcounties: vi.fn(), parishes: vi.fn(), create: vi.fn(), update: vi.fn() }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }))
vi.mock("@/lib/toast", () => ({ showToast: { success: vi.fn(), error: vi.fn() } }))
vi.mock("@/services/health-facilities.service", () => ({ healthFacilitiesService: { facilityLevels: mocks.levels, authorities: mocks.authorities, ownershipTypes: mocks.ownership, regions: mocks.regions, healthSubRegions: mocks.subRegions, districts: mocks.districts, counties: mocks.counties, healthSubDistricts: mocks.subDistricts, subcounties: mocks.subcounties, parishes: mocks.parishes, createFacility: mocks.create, updateFacility: mocks.update } }))
// Native selects exercise the cascading form state without depending on portal
// positioning and pointer events that JSDOM does not implement.
vi.mock("@/components/ui/select", () => {
  function collect(children: React.ReactNode): React.ReactElement<Record<string, unknown>>[] {
    return React.Children.toArray(children).flatMap(child => React.isValidElement<Record<string, unknown>>(child) ? [child, ...collect(child.props.children as React.ReactNode)] : [])
  }
  const Item = ({ value, children }: { value: string; children: React.ReactNode }) => <option value={value}>{children}</option>
  const Fragment = ({ children }: { children: React.ReactNode }) => <>{children}</>
  return { SelectItem: Item, SelectContent: Fragment, SelectTrigger: Fragment, SelectValue: () => null,
    Select: ({ value, onValueChange, disabled, children }: { value: string; onValueChange: (value: string) => void; disabled?: boolean; children: React.ReactNode }) => {
      const nodes = collect(children)
      const placeholder = nodes.find(node => node.props.placeholder)?.props.placeholder as string
      return <select aria-label={placeholder} value={value} disabled={disabled} onChange={event => onValueChange(event.target.value)}><option value="">{placeholder}</option>{nodes.filter(node => node.type === Item).map(node => <option key={String(node.props.value)} value={String(node.props.value)}>{node.props.children as React.ReactNode}</option>)}</select>
    } }
})
import { FacilityForm } from "./facility-form"
const initial = { name: "District Hospital", nhpi_code: "NHPI-1", hsdt_code: "HSDT-1", facility_level: "level-1", authority: "authority-1", ownership_type: "ownership-1", region: "region-a", health_sub_region: "sub-region-a", district: "district-a", county: "county-a", health_sub_district: "sub-district-a", subcounty: "subcounty-a", parish: "parish-a" }
beforeEach(() => {
  mocks.levels.mockResolvedValue([{ id: "level-1", name: "Hospital", code: "H" }])
  mocks.authorities.mockResolvedValue([{ id: "authority-1", name: "Ministry" }])
  mocks.ownership.mockResolvedValue([{ id: "ownership-1", name: "Public", code: "PUB" }])
  mocks.regions.mockResolvedValue([{ id: "region-a", name: "Region A" }, { id: "region-b", name: "Region B" }])
  mocks.subRegions.mockResolvedValue([{ id: "sub-region-a", name: "Sub-region A" }])
  mocks.districts.mockResolvedValue([{ id: "district-a", name: "District A" }])
  mocks.counties.mockResolvedValue([{ id: "county-a", name: "County A" }])
  mocks.subDistricts.mockResolvedValue([{ id: "sub-district-a", name: "Sub-district A" }])
  mocks.subcounties.mockResolvedValue([{ id: "subcounty-a", name: "Subcounty A" }])
  mocks.parishes.mockResolvedValue([{ id: "parish-a", name: "Parish A" }])
  mocks.update.mockResolvedValue({ id: "facility-1" }); mocks.create.mockResolvedValue({ id: "facility-1" })
})
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.restoreAllMocks() })
function setup(mode: "create" | "edit" = "edit") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const invalidate = vi.spyOn(client, "invalidateQueries")
  render(<QueryClientProvider client={client}><FacilityForm mode={mode} facilityId={mode === "edit" ? "facility-1" : undefined} initialData={initial} /></QueryClientProvider>)
  return { client, invalidate }
}
it("loads the existing hierarchy without clearing selected values and saves the original record", async () => {
  const { invalidate } = setup()
  await waitFor(() => expect(screen.getByRole("button", { name: "Update Facility" })).toBeEnabled())
  expect(screen.getByRole("combobox", { name: "Select parish" })).toHaveValue("parish-a")
  await userEvent.click(screen.getByRole("button", { name: "Update Facility" }))
  await waitFor(() => expect(mocks.update).toHaveBeenCalledWith("facility-1", initial))
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ["backend", "health_facilities"] })
  expect(mocks.push).toHaveBeenCalledWith("/health-facilities")
})
it("refreshes the directory after creating a facility", async () => {
  const { invalidate } = setup("create")
  await waitFor(() => expect(screen.getByRole("button", { name: "Create Facility" })).toBeEnabled())
  await userEvent.click(screen.getByRole("button", { name: "Create Facility" }))
  await waitFor(() => expect(mocks.create).toHaveBeenCalledWith(initial))
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ["backend", "health_facilities"] })
})
it("clears child locations and ignores an older district response when the region changes", async () => {
  let finishOld!: (value: unknown) => void
  mocks.districts.mockImplementation((region: string) => region === "region-a" ? new Promise(resolve => { finishOld = resolve }) : Promise.resolve([{ id: "district-b", name: "District B" }]))
  setup()
  await screen.findByRole("option", { name: "Region B" })
  await userEvent.selectOptions(screen.getByRole("combobox", { name: "Select region" }), "region-b")
  expect(screen.getByRole("combobox", { name: "Select district" })).toHaveValue("")
  expect(screen.getByRole("combobox", { name: "Select parish" })).toHaveValue("")
  expect(screen.getByRole("combobox", { name: "Select county" })).toHaveValue("")
  await screen.findByRole("option", { name: "District B" })
  await act(async () => finishOld([{ id: "district-a", name: "District A" }]))
  expect(screen.queryByRole("option", { name: "District A" })).not.toBeInTheDocument()
  expect(screen.getByRole("option", { name: "District B" })).toBeInTheDocument()
})
it("offers retry when required reference choices fail to load", async () => {
  mocks.regions.mockRejectedValueOnce(new Error("unavailable"))
  setup()
  expect(await screen.findByRole("alert")).toHaveTextContent("Some facility options could not be loaded")
  expect(screen.getByRole("button", { name: "Update Facility" })).toBeDisabled()
  await userEvent.click(screen.getByRole("button", { name: "Retry options" }))
  await waitFor(() => expect(screen.getByRole("button", { name: "Update Facility" })).toBeEnabled())
  expect(screen.queryByRole("alert")).not.toBeInTheDocument()
})
it("updates an open picker when a reference record is created elsewhere in the workspace", async () => {
  mocks.regions.mockResolvedValue([{ id: "region-a", name: "Region A" }])
  const { client } = setup()
  await screen.findByRole("option", { name: "Region A" })
  mocks.regions.mockResolvedValue([{ id: "region-a", name: "Region A" }, { id: "region-b", name: "New Region" }])
  await act(async () => { await client.invalidateQueries({ queryKey: facilityOptionsQueryKey }) })
  expect(await screen.findByRole("option", { name: "New Region" })).toBeInTheDocument()
})
