import type { VariantProps } from "class-variance-authority"
import type * as React from "react"
import { Button, type buttonVariants } from "@/components/ui/button"
import { track } from "@/lib/analytics"

type Props = VariantProps<typeof buttonVariants> & {
  href: string
  location: string
  label: string
  className?: string
  children?: React.ReactNode
}

/** An in-page anchor styled as a Button that reports cta_clicked. */
export function CtaLink({ href, location, label, children, ...buttonProps }: Props) {
  return (
    <Button asChild {...buttonProps}>
      <a href={href} onClick={() => track("cta_clicked", { location, label })}>
        {children ?? label}
      </a>
    </Button>
  )
}
