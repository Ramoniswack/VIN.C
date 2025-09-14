import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import type { VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import buttonVariants from "@/components/ui/buttonVariants"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

// Small IconButton wrapper for icon-only buttons
export interface IconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'>,
    VariantProps<typeof buttonVariants> {
  children: React.ReactNode
  ariaLabel?: string
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(({ children, className, ariaLabel, variant = 'ghost', size = 'icon', ...props }, ref) => {
  return (
    <button
      ref={ref}
      aria-label={ariaLabel}
      className={cn(buttonVariants({ size, variant, className }), 'inline-flex items-center justify-center', className)}
      {...props}
    >
      {children}
    </button>
  )
})
IconButton.displayName = 'IconButton'

export { Button, IconButton }
