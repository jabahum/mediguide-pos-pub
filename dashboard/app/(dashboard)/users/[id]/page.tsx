"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { Edit, Mail, Phone, MapPin, Building2, Globe, FileText, type LucideIcon } from "lucide-react"

import { UserSectionHeader, UserStatusBadge } from "@/components/users/user-section"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { showToast } from "@/lib/toast"
import { useDomainRecord } from "@/hooks/use-domain-record"
import { usersService } from "@/services/user-management.service"
import { UsersResponse } from "@/types/backend-types"

import { usePermissionContext } from "@/lib/permission-context"
import { EmptyState } from "@/components/ui/empty-state"
import { snakeToTitleCase } from "@/lib/utils"

export default function UserProfilePage() {
  const router = useRouter()
  const { hasPermission } = usePermissionContext()
  const params = useParams()
  const userId = params.id as string

  const { record: user, loading: isLoading, error } = useDomainRecord<UsersResponse>(
    "users",
    userId,
    usersService.get<UsersResponse>,
  )

  React.useEffect(() => {
    if (!error) return
    const err = error as { status?: number; message?: string }
    if (err?.status === 401) return // session expiry is handled globally by AuthGuard
    let title = "Load Failed"
    let message = "Could not load user data"
    if (err?.status === 404) {
      title = "User Not Found"
      message = "The requested user does not exist"
    } else if (err?.status === 403) {
      title = "Access Denied"
      message = "You do not have permission to view this user"
    } else if (err?.message?.includes("Failed to fetch")) {
      title = "Connection Error"
      message = "Could not connect to the server. Please check your connection."
    }
    showToast.error(title, message)
    router.push("/users")
  }, [error, router])

  const handleEdit = () => {
    router.push(`/users/${userId}/edit`)
  }

  const handleBack = () => {
    router.push('/users')
  }

  const formatDate = (value?: string) => {
    if (!value || Number.isNaN(Date.parse(value))) return "Not recorded"
    return new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })
  }

  const header = <UserSectionHeader title={user?.name || "User profile"} description="Contact details, professional information, and account access." showBackButton onBack={handleBack}
    actions={user && hasPermission("users", "update:any") ? [{ label: "Edit user", onClick: handleEdit, icon: <Edit className="size-4" aria-hidden="true" /> }] : []} />

  if (isLoading) return <div className="w-full min-w-0 space-y-6">{header}<div role="status" className="space-y-5"><span className="sr-only">Loading user profile…</span><Skeleton className="h-48 w-full rounded-xl" /><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{[1, 2, 3].map(item => <Skeleton key={item} className="h-64 w-full rounded-xl" />)}</div></div></div>
  if (!user) return <div className="w-full min-w-0 space-y-6">{header}<Card className="rounded-xl"><CardContent><EmptyState title="User not found" description="The account could not be loaded. Return to the directory to find another user." action={{ label: "Back to users", onClick: handleBack }} /></CardContent></Card></div>

  const hasLocation = Boolean(user.country || user.state || user.city || user.address || user.postalCode)
  const roleLabel = user.role ? snakeToTitleCase(user.role) : "No role recorded"

  return <div className="w-full min-w-0 space-y-6">
    {header}
    <Card className="min-w-0 rounded-xl shadow-xs">
      <CardContent className="space-y-5 pt-6">
        <div className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-start sm:gap-5">
          <Avatar className="size-16 shrink-0 rounded-2xl"><AvatarImage src={user.avatar || undefined} alt={user.name} /><AvatarFallback className="rounded-2xl bg-primary/5 text-lg font-semibold text-primary">{(user.name || "?").split(" ").map(part => part[0]).join("").toUpperCase().slice(0, 2)}</AvatarFallback></Avatar>
          <div className="min-w-0 flex-1 space-y-2"><h2 className="break-words text-xl font-semibold">{user.name}</h2><p className="text-sm text-muted-foreground">{user.jobTitle || "Job title not recorded"}{user.organization ? ` · ${user.organization}` : ""}</p><div className="flex flex-wrap items-center gap-2"><UserStatusBadge status={user.status} /><Badge variant="outline">{roleLabel}</Badge></div></div>
          <div className="flex flex-wrap gap-2 sm:max-w-xs sm:justify-end"><Badge variant="outline">{user.email_verified ? "Email verified" : "Email unverified"}</Badge><Badge variant="outline">{user.verified ? "Account approved" : "Account not approved"}</Badge></div>
        </div>
        <dl className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <div className="min-w-0"><dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><Mail className="size-4" aria-hidden="true" />Email address</dt><dd className="mt-2 break-all text-sm font-medium">{user.email ? <a href={`mailto:${user.email}`} className="hover:underline">{user.email}</a> : "Not recorded"}</dd></div>
          <div><dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><Phone className="size-4" aria-hidden="true" />Phone number</dt><dd className="mt-2 text-sm font-medium">{user.phone ? <a href={`tel:${user.phone}`} className="hover:underline">{user.phone}</a> : "Not recorded"}</dd></div>
          {user.alternativePhone && <div><dt className="text-xs font-medium text-muted-foreground">Alternative phone</dt><dd className="mt-2 text-sm font-medium"><a href={`tel:${user.alternativePhone}`} className="hover:underline">{user.alternativePhone}</a></dd></div>}
        </dl>
      </CardContent>
    </Card>
    <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))" }}>
      <ProfileSection title="Professional information" icon={Building2} items={[
        { label: "Role", value: roleLabel }, { label: "Organization", value: user.organization },
        { label: "Department", value: user.department }, { label: "Job title", value: user.jobTitle },
        { label: "License number", value: user.licenseNumber }, { label: "Specialization", value: user.specialization },
      ]} />
      {hasLocation && <ProfileSection title="Location information" icon={MapPin} items={[
        { label: "Country", value: user.country }, { label: "State / region", value: user.state }, { label: "City", value: user.city },
        { label: "Address", value: user.address }, { label: "Postal code", value: user.postalCode },
      ]} />}
      <ProfileSection title="System information" icon={Globe} items={[
        { label: "Preferred language", value: user.preferredLanguage }, { label: "Timezone", value: user.timezone },
        { label: "Member since", value: formatDate(user.created) }, { label: "Last updated", value: formatDate(user.updated) },
      ]} />
    </div>
    {user.notes && <Card className="rounded-xl shadow-xs"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileText className="size-5 text-muted-foreground" aria-hidden="true" />Additional notes</CardTitle></CardHeader><CardContent><p className="whitespace-pre-wrap break-words text-sm leading-7 text-muted-foreground">{user.notes}</p></CardContent></Card>}
  </div>
}

function ProfileSection({ title, icon: Icon, items }: { title: string; icon: LucideIcon; items: { label: string; value?: string }[] }) {
  return <Card className="min-w-0 rounded-xl shadow-xs"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Icon className="size-5 text-muted-foreground" aria-hidden="true" />{title}</CardTitle></CardHeader><CardContent><dl className="divide-y">{items.map(item => <div key={item.label} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-3 py-3 first:pt-0 last:pb-0"><dt className="text-xs leading-6 text-muted-foreground">{item.label}</dt><dd className="break-words text-sm font-medium leading-6">{item.value || "Not recorded"}</dd></div>)}</dl></CardContent></Card>
}
