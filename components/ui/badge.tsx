import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center w-fit whitespace-nowrap shrink-0 overflow-hidden group/badge gap-1 h-5 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-all has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&>svg]:size-3! [&>svg]:pointer-events-none",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--dc-accent-soft)] text-[var(--dc-accent)] border-[var(--dc-accent-border)]",
        secondary:
          "bg-[var(--dc-surface-2)] text-[var(--dc-text-muted)] border-[var(--dc-border)]",
        destructive:
          "bg-[var(--dc-danger-soft)] text-[var(--dc-danger)] border-[var(--dc-danger-border)]",
        outline:
          "bg-transparent text-[var(--dc-text-muted)] border-[var(--dc-border)] [a]:hover:bg-[var(--dc-surface-2)] [a]:hover:text-[var(--dc-text)]",
        ghost:
          "bg-transparent border-transparent text-[var(--dc-text-muted)] hover:bg-[var(--dc-surface-2)] hover:text-[var(--dc-text)]",
        link: "text-[var(--dc-accent)] border-transparent bg-transparent underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ className, variant })),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
