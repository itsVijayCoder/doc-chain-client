"use client"

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "gap-2 group/tabs flex data-[orientation=horizontal]:flex-col",
        className
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex items-center justify-start group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col",
  {
    variants: {
      variant: {
        // Design-system default = the design's .tabs pattern: underline on
        // the active tab, hairline bottom border spanning the list, no pill
        // chrome. Matches the document detail + audit log tab patterns.
        default:
          "gap-1 w-full border-b border-[var(--dc-border)] bg-transparent",
        // "pill" = the old shadcn-style rounded container with a filled
        // active chip. Kept for places that explicitly want it.
        pill:
          "gap-1 h-8 p-[3px] rounded-md bg-[var(--dc-surface-2)] border border-[var(--dc-border)]",
        line: "gap-1 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        // Base
        "relative inline-flex items-center justify-center gap-1.5 whitespace-nowrap px-3 py-2 text-[13px] font-medium transition-colors select-none outline-none",
        "text-[var(--dc-text-dim)] hover:text-[var(--dc-text)] data-active:text-[var(--dc-text)]",
        "[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        "disabled:pointer-events-none disabled:opacity-50",
        // Default (line) variant — underline on active, no bg/border. The
        // active strip sits on the shared list border-bottom.
        "group-data-[variant=default]/tabs-list:-mb-px group-data-[variant=default]/tabs-list:border-b-2 group-data-[variant=default]/tabs-list:border-transparent",
        "group-data-[variant=default]/tabs-list:data-active:border-[var(--dc-accent)]",
        // Pill variant — surface fill on active (for segmented toolbars)
        "group-data-[variant=pill]/tabs-list:flex-1 group-data-[variant=pill]/tabs-list:rounded group-data-[variant=pill]/tabs-list:text-[12px]",
        "group-data-[variant=pill]/tabs-list:data-active:bg-[var(--dc-surface)] group-data-[variant=pill]/tabs-list:data-active:shadow-[var(--dc-shadow-sm)]",
        // Vertical orientation handling
        "group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("text-sm flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
