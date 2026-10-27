"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import { Edit, Copy, Building2, Shield, MapPin, Hash, Calendar } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { FacilitySectionHeader } from "@/components/facilities/facility-section"
import { useDomainRecord } from "@/hooks/use-domain-record"
import { healthFacilitiesService } from "@/services/health-facilities.service"
import { showToast } from "@/lib/toast"
import { usePermissionContext } from "@/lib/permission-context"
import { 
  HealthFacilitiesResponse, 
  FacilityLevelsResponse, 
  AuthoritiesResponse, 
  OwnershipTypesResponse,
  RegionsResponse,
  DistrictsResponse,
  CountiesResponse,
  SubcountiesResponse,
  ParishesResponse,
  HealthSubDistrictsResponse,
  HealthSubRegionsResponse
} from "@/types/backend-types"

type FacilityWithExpand = HealthFacilitiesResponse<{
  facility_level: FacilityLevelsResponse
  authority: AuthoritiesResponse
  ownership_type: OwnershipTypesResponse
  region: RegionsResponse
  health_sub_region: HealthSubRegionsResponse
  district: DistrictsResponse
  county: CountiesResponse
  health_sub_district: HealthSubDistrictsResponse
  subcounty: SubcountiesResponse
  parish: ParishesResponse
}>

export default function FacilityDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const facilityId = params.id as string
  const { hasPermission, loading: permLoading } = usePermissionContext()

  const { record: facility, loading: isLoading, error } = useDomainRecord<FacilityWithExpand>(
    "health_facilities",
    facilityId,
    healthFacilitiesService.getFacility as (id: string) => Promise<FacilityWithExpand>,
  )

  React.useEffect(() => {
    if (permLoading) return
    if (!hasPermission("content", "read:any")) {
      router.replace("/health-facilities")
    }
  }, [permLoading, hasPermission, router])

  React.useEffect(() => {
    if (!error) return
    console.error("Failed to load facility:", error)
    showToast.error("Error", "Failed to load facility data")
  }, [error])

  const handleCopyCodes = async () => {
    if (!facility) return
    
    const codes = `NHPI: ${facility.nhpi_code}\nHSDT: ${facility.hsdt_code}`
    try {
      await navigator.clipboard.writeText(codes)
      showToast.success("Copied", "Facility codes copied to clipboard")
    } catch {
      showToast.error("Error", "Failed to copy codes")
    }
  }

  if (isLoading) {
    return (
      <div className="w-full min-w-0 space-y-6">
        <FacilitySectionHeader section="directory"
          title="Health Facility Details"
          description="Loading facility information..."
          showBackButton={true}
          onBack={() => router.push("/health-facilities")}
        />
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    )
  }

  if (!facility) {
    return (
      <div className="w-full min-w-0 space-y-6">
        <FacilitySectionHeader section="directory"
          title="Health Facility Details"
          description="Facility not found"
          showBackButton={true}
          onBack={() => router.push("/health-facilities")}
        />
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Facility not found</div>
        </div>
      </div>
    )
  }

  const { expand } = facility

  return (
    <div className="w-full min-w-0 space-y-6">
      <FacilitySectionHeader section="directory"
        title={facility.name}
        description="Health facility details and administrative information"
        showBackButton={true}
        onBack={() => router.push("/health-facilities")}
        actions={[
          ...(hasPermission("content", "update:any") ? [{
            label: "Edit Facility",
            onClick: () => router.push(`/health-facilities/${facilityId}/edit`),
            icon: <Edit className="h-4 w-4" />
          }] : []),
          {
            label: "Copy Codes",
            onClick: handleCopyCodes,
            icon: <Copy className="h-4 w-4" />,
            variant: "outline" as const
          }
        ]}
      />

      <div className="grid items-start gap-5 xl:grid-cols-2">
        {/* Main Information */}
        <div className="contents">
          {/* Basic Information */}
          <Card className="min-w-0 rounded-xl shadow-xs">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>Basic Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Facility Name</label>
                  <p className="break-words text-sm font-medium">{facility.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Facility Level</label>
                  <div className="mt-1">
                    {expand?.facility_level ? (
                      <Badge variant="default">
                        {expand.facility_level.name}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">NHPI Code</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Hash className="h-3 w-3 text-muted-foreground" />
                    <code className="break-all text-sm font-mono bg-muted px-2 py-1 rounded">
                      {facility.nhpi_code}
                    </code>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">HSDT Code</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Hash className="h-3 w-3 text-muted-foreground" />
                    <code className="break-all text-sm font-mono bg-muted px-2 py-1 rounded">
                      {facility.hsdt_code}
                    </code>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Classification */}
          <Card className="min-w-0 rounded-xl shadow-xs">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Classification</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Authority</label>
                  <div className="mt-1">
                    {expand?.authority ? (
                      <Badge variant="default">
                        {expand.authority.name}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Ownership Type</label>
                  <div className="mt-1">
                    {expand?.ownership_type ? (
                      <Badge variant="secondary">
                        {expand.ownership_type.name}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Facility Code</label>
                  <div className="mt-1">
                    {expand?.facility_level ? (
                      <Badge variant="outline">
                        {expand.facility_level.code}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location Hierarchy */}
          <Card className="min-w-0 rounded-xl shadow-xs">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Administrative Location</span>
              </CardTitle>
              <CardDescription>
                Complete administrative hierarchy location
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Region</label>
                  <p className="text-sm">{expand?.region?.name || "—"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Health Sub Region</label>
                  <p className="text-sm">{expand?.health_sub_region?.name || "—"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">District</label>
                  <p className="text-sm">{expand?.district?.name || "—"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Health Sub District</label>
                  <p className="text-sm">{expand?.health_sub_district?.name || "—"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">County</label>
                  <p className="text-sm">{expand?.county?.name || "—"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Subcounty</label>
                  <p className="text-sm">{expand?.subcounty?.name || "—"}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Parish</label>
                  <p className="text-sm">{expand?.parish?.name || "—"}</p>
                </div>
              </div>
              
              <Separator />
              
              {/* Hierarchy Path */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Full Administrative Path</label>
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {[
                      expand?.region?.name,
                      expand?.district?.name,
                      expand?.county?.name,
                      expand?.subcounty?.name,
                      expand?.parish?.name,
                      facility.name
                    ].filter(Boolean).join(' → ')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Record information */}
        <div className="contents">
          {/* System Information */}
          <Card className="min-w-0 rounded-xl shadow-xs">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>System Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created</label>
                <p className="text-sm">
                  {format(new Date(facility.created), 'PPpp')}
                </p>
              </div>
              {facility.updated && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                  <p className="text-sm">
                    {format(new Date(facility.updated), 'PPpp')}
                  </p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Facility ID</label>
                <code className="break-all text-sm font-mono bg-muted px-2 py-1 rounded block mt-1">
                  {facility.id}
                </code>
              </div>
            </CardContent>
          </Card>


        </div>
      </div>
    </div>
  )
}
