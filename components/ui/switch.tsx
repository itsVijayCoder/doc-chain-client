"use client"

import { Switch as SwitchPrimitive } from "@base-ui/react/switch"

import { cn } from "@/lib/utils"

function Switch({
  className,
  size = "default",
  ...props
}: SwitchPrimitive.Root.Props & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "relative inline-flex items-center shrink-0 rounded-full transition-all outline-none peer group/switch",
        "data-[size=default]:h-[22px] data-[size=default]:w-[38px] data-[size=sm]:h-[14px] data-[size=sm]:w-[24px]",
        "border data-checked:bg-[var(--dc-accent)] data-checked:border-[var(--dc-accent)]",
        "data-unchecked:bg-[var(--dc-surface-3)] data-unchecked:border-[var(--dc-border-strong)]",
        "focus-visible:[box-shadow:0_0_0_3px_var(--dc-accent-soft)]",
        "after:absolute after:-inset-x-3 after:-inset-y-2 data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block rounded-full bg-white transition-transform",
          "group-data-[size=default]/switch:size-4 group-data-[size=default]/switch:translate-x-0.5",
          "group-data-[size=default]/switch:data-checked:translate-x-[calc(100%+2px)]",
          "group-data-[size=sm]/switch:size-3 group-data-[size=sm]/switch:translate-x-0.5",
          "group-data-[size=sm]/switch:data-checked:translate-x-[calc(100%+2px)]",
          "shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
