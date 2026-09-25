import type * as React from "react"
import { useSectionView } from "@/hooks/use-section-view"
import { cn } from "@/lib/utils"

type Props = React.ComponentProps<"section"> & { name: string }

/** Page section that reports section_viewed once. */
export function Section({ name, className, children, ...props }: Props) {
  const ref = useSectionView<HTMLElement>(name)
  return (
    <section ref={ref} data-section={name} className={cn("px-4 sm:px-10 lg:px-20", className)} {...props}>
      <div className="mx-auto w-full max-w-[1280px]">{children}</div>
    </section>
  )
}

/** 52px Fraunces section title from the .pen, scaled down on small screens. */
export function SectionTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      className={cn(
        "font-heading text-[36px] leading-[1.1] font-medium tracking-[-0.7px] sm:text-[44px] lg:text-[52px] lg:tracking-[-1px]",
        className,
      )}
      {...props}
    />
  )
}
