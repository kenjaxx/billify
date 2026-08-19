import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[8px] border bg-clip-padding text-sm font-medium whitespace-nowrap transition-all duration-150 outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-primary/60 bg-transparent text-primary hover:bg-primary/10 hover:border-primary aria-expanded:bg-primary/10",
        outline:
          "border-border-strong bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground hover:border-border-stronger aria-expanded:bg-muted aria-expanded:text-foreground",
        secondary:
          "border-border bg-transparent text-secondary-foreground hover:bg-secondary/60 aria-expanded:bg-secondary/60",
        ghost:
          "border-transparent bg-transparent hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
        destructive:
          "border-destructive/40 bg-transparent text-destructive hover:bg-destructive/10 hover:border-destructive/70",
        link: "border-transparent text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-9 gap-1.5 px-3.5 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        xs: "h-6 gap-1 rounded-[6px] px-2 text-xs in-data-[slot=button-group]:rounded-[6px] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7.5 gap-1 rounded-[7px] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-[7px] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 gap-1.5 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        icon: "size-9",
        "icon-xs":
          "size-6 rounded-[6px] in-data-[slot=button-group]:rounded-[6px] [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7.5 rounded-[7px] in-data-[slot=button-group]:rounded-[7px]",
        "icon-lg": "size-10",
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
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }