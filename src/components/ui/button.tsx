import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2.5 rounded-md border border-transparent font-sans font-semibold whitespace-nowrap transition-colors outline-none select-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[18px]",
  {
    variants: {
      variant: {
        // Accent fill. Uses the deeper accent so white labels clear WCAG AA.
        default: "bg-primary-strong text-primary-foreground hover:bg-[#a8341a]",
        // Hero secondary: 1.5px ink outline, no fill.
        outline:
          "border-[1.5px] border-foreground bg-transparent font-medium text-foreground hover:bg-foreground/5",
        // Accent fill on night sections; offset ring stays visible on the dark ground.
        onDark:
          "bg-primary-strong text-primary-foreground hover:bg-[#a8341a] focus-visible:outline-primary",
        ghost: "text-foreground hover:bg-foreground/5",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        // Nav CTA: 12/20 padding, 15px label.
        default: "px-5 py-3 text-[15px] leading-[18px]",
        // Hero, forms: 18/28 padding, 17px label.
        lg: "px-7 py-[18px] text-[17px] leading-[21px]",
        // Final CTA: 20/32 padding, 18px label.
        xl: "px-8 py-5 text-lg leading-[22px]",
        icon: "size-10",
        "icon-sm": "size-8",
      },
    },
    compoundVariants: [
      // 1.5px border eats into padding: design is 17/26.
      { variant: "outline", size: "lg", className: "px-[26px] py-[17px]" },
    ],
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
