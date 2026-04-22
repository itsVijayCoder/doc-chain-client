import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-[80px] w-full rounded-md px-2.5 py-2 text-[13px] outline-none transition-all",
        "bg-[var(--dc-surface-2)] border border-[var(--dc-border)] text-[var(--dc-text)]",
        "placeholder:text-[color:var(--dc-text-dim)]",
        "focus-visible:border-[var(--dc-accent-border)] focus-visible:[box-shadow:0_0_0_3px_var(--dc-accent-soft)]",
        "aria-invalid:border-[var(--dc-danger-border)] aria-invalid:[box-shadow:0_0_0_3px_var(--dc-danger-soft)]",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
