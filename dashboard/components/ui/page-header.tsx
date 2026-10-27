"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

export interface PageHeaderActionItem {
  label: string
  onClick: () => void
  disabled?: boolean
  icon?: React.ReactNode
}

export interface PageHeaderAction {
  label: string
  onClick: () => void
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  icon?: React.ReactNode
  disabled?: boolean
  dropdownItems?: PageHeaderActionItem[]
}

export interface PageHeaderProps {
  title: string
  description?: string
  actions?: PageHeaderAction[]
  className?: string
  maxVisibleActions?: number
  showBackButton?: boolean
  onBack?: () => void
}

export function PageHeader({
  title,
  description,
  actions = [],
  className,
  maxVisibleActions = 3,
  showBackButton = false,
  onBack,
}: PageHeaderProps) {
  const visibleActions = actions.slice(0, maxVisibleActions)
  const hiddenActions = actions.slice(maxVisibleActions)
  const shouldShowDropdown = hiddenActions.length > 0

  return (
    <div className={cn("flex flex-col gap-4 pb-6", className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-3">
            {showBackButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                aria-label="Go back"
                className="flex items-center justify-center h-8 w-8 p-0 hover:bg-muted"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          </div>
          {description && (
            <p className={cn(
              "text-muted-foreground text-sm leading-6",
              showBackButton && "ml-11"
            )}>
              {description.length > 100 ? `${description.substring(0, 100)}...` : description}
            </p>
          )}
        </div>
        
        {actions.length > 0 && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Individual action buttons - always show when not too many actions */}
            <div className={cn(
              "flex gap-2",
              actions.length > maxVisibleActions && "hidden sm:flex"
            )}>
              {visibleActions.map((action, index) => 
                action.dropdownItems ? (
                  <DropdownMenu key={index}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant={action.variant || "default"}
                        disabled={action.disabled}
                        className="flex items-center gap-2"
                      >
                        {action.icon}
                        {action.label}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {action.dropdownItems.map((item, itemIndex) => (
                        <DropdownMenuItem
                          key={itemIndex}
                          onClick={item.onClick}
                          disabled={item.disabled}
                          className="flex items-center gap-2"
                        >
                          {item.icon}
                          {item.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    key={index}
                    variant={action.variant || "default"}
                    onClick={action.onClick}
                    disabled={action.disabled}
                    className="flex items-center gap-2"
                  >
                    {action.icon}
                    {action.label}
                  </Button>
                )
              )}
            </div>

            {/* Mobile/overflow dropdown - only show when actions exceed maxVisibleActions */}
            {actions.length > maxVisibleActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 sm:hidden"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {actions.map((action, index) => 
                    action.dropdownItems ? (
                      action.dropdownItems.map((item, itemIndex) => (
                        <DropdownMenuItem
                          key={`${index}-${itemIndex}`}
                          onClick={item.onClick}
                          disabled={item.disabled}
                          className="flex items-center gap-2"
                        >
                          {item.icon}
                          {item.label}
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <DropdownMenuItem
                        key={index}
                        onClick={action.onClick}
                        disabled={action.disabled}
                        className="flex items-center gap-2"
                      >
                        {action.icon}
                        {action.label}
                      </DropdownMenuItem>
                    )
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Desktop overflow dropdown for excess actions */}
            {shouldShowDropdown && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "items-center gap-2",
                      visibleActions.length <= 2 ? "hidden xs:flex" : "hidden sm:flex"
                    )}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    More
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {hiddenActions.map((action, index) => 
                    action.dropdownItems ? (
                      action.dropdownItems.map((item, itemIndex) => (
                        <DropdownMenuItem
                          key={`hidden-${index}-${itemIndex}`}
                          onClick={item.onClick}
                          disabled={item.disabled}
                          className="flex items-center gap-2"
                        >
                          {item.icon}
                          {item.label}
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <DropdownMenuItem
                        key={index + maxVisibleActions}
                        onClick={action.onClick}
                        disabled={action.disabled}
                        className="flex items-center gap-2"
                      >
                        {action.icon}
                        {action.label}
                      </DropdownMenuItem>
                    )
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}
      </div>
    </div>
  )
}