"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FacilityFormNavigation } from "@/components/facilities/facility-section"
import { facilityOptionsQueryKey } from "@/lib/facility-query-keys"
import { showToast } from "@/lib/toast"
import { healthFacilitiesService } from "@/services/health-facilities.service"
// Form validation schema
const facilityFormSchema = z.object({
  name: z.string().min(1, "Facility name is required"),
  nhpi_code: z.string().min(1, "NHPI code is required"),
  hsdt_code: z.string().min(1, "HSDT code is required"),
  
  // Classification
  facility_level: z.string().min(1, "Facility level is required"),
  authority: z.string().min(1, "Authority is required"),
  ownership_type: z.string().min(1, "Ownership type is required"),
  
  // Geographic hierarchy
  region: z.string().min(1, "Region is required"),
  health_sub_region: z.string().min(1, "Health sub region is required"),
  district: z.string().min(1, "District is required"),
  county: z.string().min(1, "County is required"),
  health_sub_district: z.string().min(1, "Health sub district is required"),
  subcounty: z.string().min(1, "Subcounty is required"),
  parish: z.string().min(1, "Parish is required"),
})

type FacilityFormValues = z.infer<typeof facilityFormSchema>

interface FacilityFormProps {
  initialData?: Partial<FacilityFormValues>
  mode: "create" | "edit"
  facilityId?: string
}

export function FacilityForm({ initialData, mode, facilityId }: FacilityFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = React.useState(false)
  
  const form = useForm<FacilityFormValues>({
    resolver: zodResolver(facilityFormSchema),
    defaultValues: {
      name: "",
      nhpi_code: "",
      hsdt_code: "",
      facility_level: "",
      authority: "",
      ownership_type: "",
      region: "",
      health_sub_region: "",
      district: "",
      county: "",
      health_sub_district: "",
      subcounty: "",
      parish: "",
      ...initialData,
    },
  })

  const selectedRegion = useWatch({ control: form.control, name: "region" })
  const selectedDistrict = useWatch({ control: form.control, name: "district" })
  const selectedCounty = useWatch({ control: form.control, name: "county" })
  const selectedSubcounty = useWatch({ control: form.control, name: "subcounty" })

  const levelsQuery = useQuery({ queryKey: [...facilityOptionsQueryKey, "facility-levels"], queryFn: healthFacilitiesService.facilityLevels })
  const authoritiesQuery = useQuery({ queryKey: [...facilityOptionsQueryKey, "authorities"], queryFn: () => healthFacilitiesService.authorities() })
  const ownershipQuery = useQuery({ queryKey: [...facilityOptionsQueryKey, "ownership-types"], queryFn: healthFacilitiesService.ownershipTypes })
  const regionsQuery = useQuery({ queryKey: [...facilityOptionsQueryKey, "regions"], queryFn: healthFacilitiesService.regions })
  const subRegionsQuery = useQuery({ queryKey: [...facilityOptionsQueryKey, "health-sub-regions", selectedRegion], queryFn: () => healthFacilitiesService.healthSubRegions(selectedRegion), enabled: Boolean(selectedRegion) })
  const districtsQuery = useQuery({ queryKey: [...facilityOptionsQueryKey, "districts", selectedRegion], queryFn: () => healthFacilitiesService.districts(selectedRegion), enabled: Boolean(selectedRegion) })
  const countiesQuery = useQuery({ queryKey: [...facilityOptionsQueryKey, "counties", selectedDistrict], queryFn: () => healthFacilitiesService.counties(selectedDistrict), enabled: Boolean(selectedDistrict) })
  const subDistrictsQuery = useQuery({ queryKey: [...facilityOptionsQueryKey, "health-sub-districts", selectedDistrict], queryFn: () => healthFacilitiesService.healthSubDistricts(selectedDistrict), enabled: Boolean(selectedDistrict) })
  const subcountiesQuery = useQuery({ queryKey: [...facilityOptionsQueryKey, "subcounties", selectedDistrict, selectedCounty], queryFn: () => healthFacilitiesService.subcounties(selectedDistrict, selectedCounty), enabled: Boolean(selectedCounty && selectedDistrict) })
  const parishesQuery = useQuery({ queryKey: [...facilityOptionsQueryKey, "parishes", selectedSubcounty], queryFn: () => healthFacilitiesService.parishes(selectedSubcounty), enabled: Boolean(selectedSubcounty) })
  const facilityLevels = levelsQuery.data || []
  const authorities = authoritiesQuery.data || []
  const ownershipTypes = ownershipQuery.data || []
  const regions = regionsQuery.data || []
  const healthSubRegions = subRegionsQuery.data || []
  const districts = districtsQuery.data || []
  const counties = countiesQuery.data || []
  const healthSubDistricts = subDistrictsQuery.data || []
  const subcounties = subcountiesQuery.data || []
  const parishes = parishesQuery.data || []
  const choiceQueries = [levelsQuery, authoritiesQuery, ownershipQuery, regionsQuery, subRegionsQuery, districtsQuery, countiesQuery, subDistrictsQuery, subcountiesQuery, parishesQuery]
  const choicesFetching = choiceQueries.some(query => query.isFetching)
  const choicesError = choiceQueries.some(query => query.isError)

  const resetLocationFields = React.useCallback((fields: Array<keyof FacilityFormValues>) => {
    fields.forEach((fieldName) => {
      form.setValue(fieldName, "", { shouldDirty: true, shouldValidate: false })
    })
  }, [form])

  const handleRegionChange = React.useCallback((value: string) => {
    form.setValue("region", value, { shouldDirty: true, shouldValidate: true })
    resetLocationFields(["health_sub_region", "district", "county", "health_sub_district", "subcounty", "parish"])
  }, [form, resetLocationFields])

  const handleDistrictChange = React.useCallback((value: string) => {
    form.setValue("district", value, { shouldDirty: true, shouldValidate: true })
    resetLocationFields(["county", "health_sub_district", "subcounty", "parish"])
  }, [form, resetLocationFields])

  const handleCountyChange = React.useCallback((value: string) => {
    form.setValue("county", value, { shouldDirty: true, shouldValidate: true })
    resetLocationFields(["subcounty", "parish"])
  }, [form, resetLocationFields])

  const handleSubcountyChange = React.useCallback((value: string) => {
    form.setValue("subcounty", value, { shouldDirty: true, shouldValidate: true })
    resetLocationFields(["parish"])
  }, [form, resetLocationFields])

  const onSubmit = async (data: FacilityFormValues) => {
    setIsLoading(true)
    try {
      if (mode === "create") {
        await healthFacilitiesService.createFacility(data)
        showToast.success("Success", "Health facility created successfully")
      } else if (mode === "edit" && facilityId) {
        await healthFacilitiesService.updateFacility(facilityId, data)
        showToast.success("Success", "Health facility updated successfully")
      }

      await queryClient.invalidateQueries({ queryKey: ["backend", "health_facilities"] })
      router.push('/health-facilities')
    } catch (error) {
      console.error("Failed to save facility:", error)
      showToast.error(
        "Error", 
        `Failed to ${mode === "create" ? "create" : "update"} facility`
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
    <FacilityFormNavigation />
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid min-w-0 items-start gap-5 xl:grid-cols-2">
        {choicesError && <Alert variant="destructive" className="xl:col-span-2"><AlertDescription className="flex flex-wrap items-center justify-between gap-3"><span>Some facility options could not be loaded. Retry before saving.</span><Button type="button" variant="outline" size="sm" onClick={() => void queryClient.invalidateQueries({ queryKey: facilityOptionsQueryKey })}>Retry options</Button></AlertDescription></Alert>}
        {/* Basic Information */}
        <Card id="facility-identity" className="min-w-0 scroll-mt-24 rounded-xl shadow-xs">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Enter the basic details of the health facility
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Facility Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Abim General Hospital" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nhpi_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NHPI Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., HFA6Q7GB2" {...field} />
                    </FormControl>
                    <FormDescription>
                      National Health Planning Identifier code
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="hsdt_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>HSDT Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., SCL79ULU0/PA95VLAL8/8001" {...field} />
                    </FormControl>
                    <FormDescription>
                      Health Service Delivery Tree code
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Classification */}
        <Card id="facility-classification" className="min-w-0 scroll-mt-24 rounded-xl shadow-xs">
          <CardHeader>
            <CardTitle>Classification</CardTitle>
            <CardDescription>
              Classify the facility by level, authority, and ownership
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="facility_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facility Level</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isLoading || levelsQuery.isPending || levelsQuery.isError}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {facilityLevels.map((level) => (
                          <SelectItem key={level.id} value={level.id}>
                            {level.name} ({level.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="authority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Authority</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isLoading || authoritiesQuery.isPending || authoritiesQuery.isError}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select authority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {authorities.map((authority) => (
                          <SelectItem key={authority.id} value={authority.id}>
                            {authority.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ownership_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ownership Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isLoading || ownershipQuery.isPending || ownershipQuery.isError}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select ownership" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ownershipTypes.map((ownership) => (
                          <SelectItem key={ownership.id} value={ownership.id}>
                            {ownership.name} ({ownership.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Geographic Location */}
        <Card id="facility-location" className="min-w-0 scroll-mt-24 rounded-xl shadow-xs xl:col-span-2">
          <CardHeader>
            <CardTitle>Geographic Location</CardTitle>
            <CardDescription>
              Select the administrative hierarchy location of the facility
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Region and Health Sub Region */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Region</FormLabel>
                    <Select onValueChange={handleRegionChange} value={field.value} disabled={isLoading || regionsQuery.isPending || regionsQuery.isError}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select region" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {regions.map((region) => (
                          <SelectItem key={region.id} value={region.id}>
                            {region.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="health_sub_region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Health Sub Region</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={isLoading || !selectedRegion || subRegionsQuery.isFetching || subRegionsQuery.isError}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select health sub region" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {healthSubRegions.map((hsr) => (
                          <SelectItem key={hsr.id} value={hsr.id}>
                            {hsr.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* District and Health Sub District */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="district"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>District</FormLabel>
                    <Select 
                      onValueChange={handleDistrictChange} 
                      value={field.value}
                      disabled={isLoading || !selectedRegion || districtsQuery.isFetching || districtsQuery.isError}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select district" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {districts.map((district) => (
                          <SelectItem key={district.id} value={district.id}>
                            {district.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="health_sub_district"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Health Sub District</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={isLoading || !selectedDistrict || subDistrictsQuery.isFetching || subDistrictsQuery.isError}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select health sub district" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {healthSubDistricts.map((hsd) => (
                          <SelectItem key={hsd.id} value={hsd.id}>
                            {hsd.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* County, Subcounty, Parish */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="county"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>County</FormLabel>
                    <Select 
                      onValueChange={handleCountyChange} 
                      value={field.value}
                      disabled={isLoading || !selectedDistrict || countiesQuery.isFetching || countiesQuery.isError}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select county" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {counties.map((county) => (
                          <SelectItem key={county.id} value={county.id}>
                            {county.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subcounty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subcounty</FormLabel>
                    <Select 
                      onValueChange={handleSubcountyChange} 
                      value={field.value}
                      disabled={isLoading || !selectedCounty || subcountiesQuery.isFetching || subcountiesQuery.isError}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select subcounty" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {subcounties.map((subcounty) => (
                          <SelectItem key={subcounty.id} value={subcounty.id}>
                            {subcounty.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="parish"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parish</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={isLoading || !selectedSubcounty || parishesQuery.isFetching || parishesQuery.isError}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select parish" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {parishes.map((parish) => (
                          <SelectItem key={parish.id} value={parish.id}>
                            {parish.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>


        {/* Form Actions */}
        <div className="flex flex-wrap items-center justify-end gap-3 rounded-xl border bg-muted/20 p-4 xl:col-span-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/health-facilities")}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || choicesFetching || choicesError}>
            {isLoading ? (mode === "create" ? "Creating..." : "Updating...") : (mode === "create" ? "Create Facility" : "Update Facility")}
          </Button>
        </div>
      </form>
    </Form>
    </>
  )
}
