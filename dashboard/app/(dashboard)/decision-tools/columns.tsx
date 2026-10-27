"use client";

import * as React from "react";
import Link from "next/link";
import { ToolStatusBadge } from "@/components/clinical-tools/tool-section";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/ui/datatable-column-header";
import { ExtendedColumnDef } from "@/types/data-table";
import { DecisionToolWithRelations } from "./types";
import { getAppFileLabel } from "./app-file";
import { StoredIcon } from "@/components/ui/stored-icon";
import { RiskLevelBadge } from "@/components/clinical-tools/risk-level";
import { useToolCategories } from "@/hooks/use-tool-categories";

import {
  CalculatorsTypeOptions,
  CalculatorsStatusOptions,
} from "@/types/backend-types";
import { Calculator, Brain, CheckSquare } from "lucide-react";

/**
 * Get icon component for decision tool type
 */
const getTypeIcon = (type: CalculatorsTypeOptions) => {
  switch (type) {
    case CalculatorsTypeOptions.calculator:
      return <Calculator className="h-4 w-4" />;
    case CalculatorsTypeOptions.decision_tool:
      return <Brain className="h-4 w-4" />;
    case CalculatorsTypeOptions.checklist:
      return <CheckSquare className="h-4 w-4" />;
    default:
      return <Calculator className="h-4 w-4" />;
  }
};

function ToolCategoryCell({ categoryId }: { categoryId?: string }) {
  const { byId } = useToolCategories();
  const category = categoryId ? byId.get(categoryId) : undefined;
  if (!category) {
    return <span className="text-muted-foreground">{categoryId ? "…" : "Uncategorised"}</span>;
  }
  return (
    <span className="flex items-center gap-1.5 text-sm">
      <span style={category.color ? { color: category.color } : undefined}>
        <StoredIcon icon={category.icon} fallback={null} className="h-3.5 w-3.5" />
      </span>
      {category.name}
    </span>
  );
}

/**
 * Get badge variant for type
 */
const getTypeVariant = (type: CalculatorsTypeOptions) => {
  switch (type) {
    case CalculatorsTypeOptions.calculator:
      return "default";
    case CalculatorsTypeOptions.decision_tool:
      return "secondary";
    case CalculatorsTypeOptions.checklist:
      return "outline";
    default:
      return "secondary";
  }
};

export const columns: ExtendedColumnDef<DecisionToolWithRelations>[] = [
  // ESSENTIAL COLUMNS (Always Visible)
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Tool Name"
        canSort={true}
        canFilter={true}
        filterType="text"
      />
    ),
    cell: ({ row }) => {
      const name = row.getValue("name") as string;
      const type = row.original.type;
      const icon = row.original.icon;

      return (
        <div className="flex min-w-[240px] max-w-xl items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border bg-muted/50"><StoredIcon icon={icon} fallback={getTypeIcon(type)} /></span>
          <div className="min-w-0"><Link href={`/decision-tools/${row.original.id}`} className="whitespace-normal break-words font-semibold hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{name}</Link>{row.original.description && <p className="mt-1 line-clamp-2 whitespace-normal text-xs leading-5 text-muted-foreground">{row.original.description}</p>}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "type",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Type"
        canSort={true}
        canFilter={true}
        filterType="select"
        filterOptions={[
          { label: "Calculator", value: "calculator" },
          { label: "Decision Tool", value: "decision_tool" },
          { label: "Checklist", value: "checklist" },
        ]}
      />
    ),
    cell: ({ row }) => {
      const type = row.getValue("type") as CalculatorsTypeOptions;
      const displayType =
        type === CalculatorsTypeOptions.decision_tool
          ? "Decision Tool"
          : type.charAt(0).toUpperCase() + type.slice(1);

      return (
        <Badge
          variant={
            getTypeVariant(type) as
              | "default"
              | "secondary"
              | "destructive"
              | "outline"
          }
        >
          {displayType}
        </Badge>
      );
    },
  },
  {
    accessorKey: "category_id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Category" canSort={false} />
    ),
    cell: ({ row }) => <ToolCategoryCell categoryId={row.original.category_id} />,
  },
  {
    accessorKey: "risk_level",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Risk" canSort={false} />
    ),
    cell: ({ row }) => <RiskLevelBadge level={row.original.risk_level} />,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Status"
        canSort={true}
        canFilter={true}
        filterType="select"
        filterOptions={[
          { label: "Active", value: "active" },
          { label: "Draft", value: "draft" },
          { label: "Archived", value: "archived" },
        ]}
      />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as CalculatorsStatusOptions;
      return <ToolStatusBadge status={status} />;
    },
  },
  {
    accessorKey: "description",
    defaultVisible: false,
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Description"
        canSort={false}
        canFilter={true}
        filterType="text"
      />
    ),
    cell: ({ row }) => {
      const description = row.getValue("description") as string;
      return description ? (
        <div className="max-w-xs truncate text-sm" title={description}>
          {description}
        </div>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
  },

  // ADDITIONAL INFORMATION (Hidden by default)
  {
    accessorKey: "usageCount",
    defaultVisible: false,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Usage" canSort={false} />
    ),
    cell: ({ row }) => {
      const usageCount = (row.getValue("usageCount") as number) || 0;
      return <span className="text-sm">{usageCount.toLocaleString()}</span>;
    },
  },
  {
    accessorKey: "version",
    defaultVisible: false,
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Version"
        canSort={true}
        canFilter={true}
        filterType="text"
      />
    ),
    cell: ({ row }) => {
      const version = row.getValue("version") as string;
      return version ? (
        <Badge variant="outline" className="font-mono text-xs">
          v{version}
        </Badge>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
  },
  {
    accessorKey: "appFile",
    defaultVisible: false,
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="App File"
        canSort={false}
        canFilter={true}
        filterType="text"
      />
    ),
    cell: ({ row }) => {
      const appFile = getAppFileLabel(row.getValue("appFile"));
      return appFile ? (
        <div className="max-w-xs truncate font-mono text-xs" title={appFile}>
          {appFile}
        </div>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
  },

  // VISUAL PROPERTIES (Hidden by default)
  {
    accessorKey: "color",
    defaultVisible: false,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Color" canSort={false} />
    ),
    cell: ({ row }) => {
      const color = row.getValue("color") as string;
      return color ? (
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded border"
            style={{ backgroundColor: color }}
            title={color}
          />
          <span className="text-xs font-mono">{color}</span>
        </div>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
  },
  {
    accessorKey: "backgroundColor",
    defaultVisible: false,
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Background Color"
        canSort={false}
      />
    ),
    cell: ({ row }) => {
      const bgColor = row.getValue("backgroundColor") as string;
      return bgColor ? (
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded border"
            style={{ backgroundColor: bgColor }}
            title={bgColor}
          />
          <span className="text-xs font-mono">{bgColor}</span>
        </div>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
  },

  // RELATIONS (Hidden by default)
  {
    id: "addedBy",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Added By" canSort={false} />
    ),
    accessorFn: (row) => {
      const addedBy = row.expand?.addedBy;
      if (Array.isArray(addedBy) && addedBy.length > 0) {
        return addedBy.map((user) => user.name || user.email).join(", ");
      }
      return "";
    },
    cell: ({ row }) => {
      const addedBy = row.original.expand?.addedBy;
      if (Array.isArray(addedBy) && addedBy.length > 0) {
        const names = addedBy.map((user) => user.name || user.email);
        if (names.length === 1) {
          return <span className="text-sm">{names[0]}</span>;
        } else {
          return (
            <span className="text-sm" title={names.join(", ")}>
              {names[0]} +{names.length - 1}
            </span>
          );
        }
      }
      return <span className="text-muted-foreground">—</span>;
    },
    defaultVisible: false,
  },

  // TIMESTAMPS (Hidden by default)
  {
    accessorKey: "created",
    defaultVisible: false,
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Created"
        canSort={true}
        canFilter={true}
        filterType="dateRange"
      />
    ),
    cell: ({ row }) => {
      const date = row.getValue("created") as string;
      return date ? (
        <span className="text-xs text-muted-foreground">
          {new Date(date).toLocaleDateString()}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
  },
  {
    accessorKey: "updated",
    defaultVisible: false,
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Last Updated"
        canSort={true}
        canFilter={true}
        filterType="dateRange"
      />
    ),
    cell: ({ row }) => {
      const date = row.getValue("updated") as string;
      return date ? (
        <span className="text-xs text-muted-foreground">
          {new Date(date).toLocaleDateString()}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
  },
];

// Re-export the type for use in other files
export type { DecisionToolWithRelations };
