import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// All variants use design-system tokens (--dc-*). Colors are applied via
// arbitrary Tailwind syntax so every Button anywhere in the app picks up
// the theme automatically — no per-site overrides needed.
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-[13px] font-medium rounded-md border border-transparent transition-all disabled:pointer-events-none disabled:opacity-50 outline-none group/button select-none shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Primary = accent emerald fill, dark text (per design .btn-primary)
        default:
          "bg-[var(--dc-accent)] text-[#061f15] font-semibold border-[var(--dc-accent)] hover:bg-[var(--dc-accent-hover)] hover:border-[var(--dc-accent-hover)]",
        // Outline = surface + border, our default chrome button (.btn)
        outline:
          "bg-[var(--dc-surface)] text-[var(--dc-text)] border-[var(--dc-border)] hover:bg-[var(--dc-surface-2)] hover:border-[var(--dc-border-strong)]",
        // Secondary = surface-2 fill (used for inline segmented buttons)
        secondary:
          "bg-[var(--dc-surface-2)] text-[var(--dc-text)] border-[var(--dc-border)] hover:bg-[var(--dc-surface-3)]",
        // Ghost = transparent, text-muted, fades to surface-2 on hover
        ghost:
          "bg-transparent text-[var(--dc-text-muted)] hover:bg-[var(--dc-surface-2)] hover:text-[var(--dc-text)]",
        // Destructive = danger-soft fill + danger text + danger border
        destructive:
          "bg-[var(--dc-danger-soft)] text-[var(--dc-danger)] border-[var(--dc-danger-border)] hover:bg-[var(--dc-danger-soft)] hover:brightness-110",
        link: "text-[var(--dc-accent)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-8 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-md px-2 text-[11px] in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-md px-2.5 text-[12px] in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-3.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        icon: "size-8",
        "icon-xs": "size-6 rounded-md in-data-[slot=button-group]:rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7 rounded-md in-data-[slot=button-group]:rounded-md",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
