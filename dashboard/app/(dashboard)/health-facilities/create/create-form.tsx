"use client"

import * as React from "react"
import { useDashboardRouter as useRouter } from "@/components/dialogs/create-dialog-context"
import { useQueryClient } from "@tanstack/react-query"
import { facilityOptionsQueryKey } from "@/lib/facility-query-keys"
import { Plus } from "lucide-react"

import { FacilitySectionHeader } from "@/components/facilities/facility-section"
import { usePermissionContext } from "@/lib/permission-context"
import { FacilityForm } from "../components/facility-form"
import { CreateCountyModal } from "../components/create-county-modal"
import { CreateSubcountyModal } from "../components/create-subcounty-modal"
import { CreateParishModal } from "../components/create-parish-modal"
import { CreateDistrictModal } from "../components/create-district-modal"
import { CreateRegionModal } from "../components/create-region-modal"

export default function CreateFacilityPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const refreshLocations = React.useCallback((collection: string) => {
    void queryClient.invalidateQueries({ queryKey: facilityOptionsQueryKey })
    void queryClient.invalidateQueries({ queryKey: ["backend", collection] })
  }, [queryClient])
  const { hasPermission, loading } = usePermissionContext()

  React.useEffect(() => {
    if (loading) return
    if (!hasPermission("content", "create:any")) {
      router.replace("/health-facilities")
    }
  }, [loading, hasPermission, router])

  const [showCountyModal, setShowCountyModal] = React.useState(false)
  const [showSubcountyModal, setShowSubcountyModal] = React.useState(false)
  const [showParishModal, setShowParishModal] = React.useState(false)
  const [showDistrictModal, setShowDistrictModal] = React.useState(false)
  const [showRegionModal, setShowRegionModal] = React.useState(false)

  return (
    <div className="w-full min-w-0 space-y-6">
      <FacilitySectionHeader section="directory"
        title="Add Health Facility"
        description="Create a new health facility in the system"
        showBackButton={true}
        onBack={() => router.push("/health-facilities")}
        actions={[
          {
            label: "Create Location",
            onClick: () => {},
            icon: <Plus className="h-4 w-4" />,
            variant: "outline",
            dropdownItems: [
              {
                label: "Create Region",
                onClick: () => setShowRegionModal(true)
              },
              {
                label: "Create District",
                onClick: () => setShowDistrictModal(true)
              },
              {
                label: "Create County",
                onClick: () => setShowCountyModal(true)
              },
              {
                label: "Create Subcounty",
                onClick: () => setShowSubcountyModal(true)
              },
              {
                label: "Create Parish",
                onClick: () => setShowParishModal(true)
              }
            ]
          }
        ]}
      />

      <FacilityForm mode="create" />

      {/* Administrative Entity Creation Modals */}
      <CreateRegionModal onSuccess={() => refreshLocations("regions")}
        open={showRegionModal}
        onClose={() => setShowRegionModal(false)}
      />
      <CreateDistrictModal onSuccess={() => refreshLocations("districts")}
        open={showDistrictModal}
        onClose={() => setShowDistrictModal(false)}
      />
      <CreateCountyModal onSuccess={() => refreshLocations("counties")}
        open={showCountyModal}
        onClose={() => setShowCountyModal(false)}
      />
      <CreateSubcountyModal onSuccess={() => refreshLocations("subcounties")}
        open={showSubcountyModal}
        onClose={() => setShowSubcountyModal(false)}
      />
      <CreateParishModal onSuccess={() => refreshLocations("parishes")}
        open={showParishModal}
        onClose={() => setShowParishModal(false)}
      />
    </div>
  )
}
