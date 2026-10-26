'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PageHeader } from "@/components/ui/page-header"
import {
  AlertTriangle,
  Search,
  Filter,
  Pill,
  Shield,
  Info,
  ExternalLink,
  Download,
  RefreshCw
} from "lucide-react"
import { useState } from "react"
import * as React from "react"
import { useRouter } from "next/navigation"
import { usePermissionContext } from "@/lib/permission-context"

const interactions = [
  {
    id: 1,
    drug1: "Warfarin",
    drug2: "Aspirin",
    severity: "major",
    mechanism: "Additive anticoagulant effects",
    clinicalEffect: "Increased risk of bleeding complications",
    management: "Monitor INR closely, consider dose adjustment",
    evidence: "well-established",
    frequency: "common"
  },
  {
    id: 2,
    drug1: "Digoxin",
    drug2: "Furosemide",
    severity: "moderate",
    mechanism: "Hypokalemia increases digoxin toxicity",
    clinicalEffect: "Enhanced digitalis toxicity symptoms",
    management: "Monitor potassium levels, supplement if needed",
    evidence: "well-established",
    frequency: "frequent"
  },
  {
    id: 3,
    drug1: "Metformin",
    drug2: "Contrast Media",
    severity: "major",
    mechanism: "Reduced renal clearance of metformin",
    clinicalEffect: "Risk of lactic acidosis",
    management: "Hold metformin 48h before/after contrast",
    evidence: "well-established",
    frequency: "occasional"
  },
  {
    id: 4,
    drug1: "ACE Inhibitors",
    drug2: "NSAIDs",
    severity: "moderate",
    mechanism: "Reduced renal function, hyperkalemia",
    clinicalEffect: "Decreased antihypertensive effect, kidney injury",
    management: "Monitor renal function and electrolytes",
    evidence: "well-established",
    frequency: "common"
  },
  {
    id: 5,
    drug1: "Simvastatin",
    drug2: "Clarithromycin",
    severity: "major",
    mechanism: "CYP3A4 inhibition increases statin levels",
    clinicalEffect: "Increased risk of myopathy and rhabdomyolysis",
    management: "Avoid combination or use alternative antibiotic",
    evidence: "well-established",
    frequency: "rare"
  },
  {
    id: 6,
    drug1: "Insulin",
    drug2: "Beta-blockers",
    severity: "moderate",
    mechanism: "Masking of hypoglycemic symptoms",
    clinicalEffect: "Delayed recognition of hypoglycemia",
    management: "Educate patient, monitor glucose closely",
    evidence: "well-established",
    frequency: "frequent"
  }
]

const severityLevels = ["all", "major", "moderate", "minor"]
const evidenceLevels = ["all", "well-established", "probable", "possible"]

export default function DrugInteractionsPage() {
  const router = useRouter()
  const { hasPermission, loading } = usePermissionContext()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSeverity, setSelectedSeverity] = useState("all")
  const [selectedEvidence, setSelectedEvidence] = useState("all")

  React.useEffect(() => {
    if (loading) return
    if (!hasPermission("content", "read:any")) {
      router.replace("/drugs")
    }
  }, [loading, hasPermission, router])

  const filteredInteractions = interactions.filter(interaction => {
    const matchesSearch =
      interaction.drug1.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interaction.drug2.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interaction.clinicalEffect.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSeverity = selectedSeverity === "all" || interaction.severity === selectedSeverity
    const matchesEvidence = selectedEvidence === "all" || interaction.evidence === selectedEvidence
    return matchesSearch && matchesSeverity && matchesEvidence
  })

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "major": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "moderate": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
      case "minor": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "major": return <AlertTriangle className="h-4 w-4 text-red-600" />
      case "moderate": return <Shield className="h-4 w-4 text-orange-600" />
      case "minor": return <Info className="h-4 w-4 text-yellow-600" />
      default: return <Info className="h-4 w-4 text-gray-600" />
    }
  }

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case "common": return "text-red-600 dark:text-red-400"
      case "frequent": return "text-orange-600 dark:text-orange-400"
      case "occasional": return "text-blue-600 dark:text-blue-400"
      case "rare": return "text-gray-600 dark:text-gray-400"
      default: return "text-gray-600 dark:text-gray-400"
    }
  }

  return (
    <div className="w-full min-w-0 space-y-6">
      <PageHeader
        title="Drug Interactions"
        description="Clinical drug interaction database for healthcare providers"
        actions={[
          {
            label: "Export",
            variant: "outline",
            icon: <Download className="h-4 w-4" />,
            onClick: () => {},
          },
          {
            label: "Refresh",
            variant: "outline",
            icon: <RefreshCw className="h-4 w-4" />,
            onClick: () => {},
          },
        ]}
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Interactions</p>
                <p className="text-2xl font-bold">{interactions.length}</p>
              </div>
              <Pill className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Major Interactions</p>
                <p className="text-2xl font-bold">{interactions.filter(i => i.severity === 'major').length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Moderate Interactions</p>
                <p className="text-2xl font-bold">{interactions.filter(i => i.severity === 'moderate').length}</p>
              </div>
              <Shield className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Well-Established</p>
                <p className="text-2xl font-bold">{interactions.filter(i => i.evidence === 'well-established').length}</p>
              </div>
              <Info className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Input
                placeholder="Search by drug name or effect..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:shrink-0">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {severityLevels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Select value={selectedEvidence} onValueChange={setSelectedEvidence}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {evidenceLevels.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level === 'all' ? 'All Evidence' : level.charAt(0).toUpperCase() + level.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Interactions List */}
      <div className="space-y-4">
        {filteredInteractions.map((interaction) => (
          <Card key={interaction.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    {getSeverityIcon(interaction.severity)}
                    <CardTitle className="text-lg">
                      {interaction.drug1} + {interaction.drug2}
                    </CardTitle>
                    <Badge className={getSeverityColor(interaction.severity)}>
                      {interaction.severity}
                    </Badge>
                  </div>
                  <CardDescription className="text-base">
                    {interaction.clinicalEffect}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium ${getFrequencyColor(interaction.frequency)}`}>
                    {interaction.frequency}
                  </span>
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Mechanism</h4>
                    <p className="text-sm">{interaction.mechanism}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Evidence Level</h4>
                    <Badge variant="secondary">{interaction.evidence}</Badge>
                  </div>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Management:</strong> {interaction.management}
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredInteractions.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Pill className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No interactions found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
