import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "w-full min-w-0 h-[34px] rounded-md px-2.5 py-1 text-[13px] outline-none transition-all",
        "bg-[var(--dc-surface-2)] border border-[var(--dc-border)] text-[var(--dc-text)]",
        "placeholder:text-[color:var(--dc-text-dim)]",
        "focus-visible:border-[var(--dc-accent-border)] focus-visible:[box-shadow:0_0_0_3px_var(--dc-accent-soft)]",
        "aria-invalid:border-[var(--dc-danger-border)] aria-invalid:[box-shadow:0_0_0_3px_var(--dc-danger-soft)]",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "file:h-6 file:text-[13px] file:font-medium file:text-[color:var(--dc-text)] file:inline-flex file:border-0 file:bg-transparent",
        className
      )}
      {...props}
    />
  )
}

export { Input }
