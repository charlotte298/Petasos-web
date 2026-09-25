import * as React from "react"
import { cn } from "cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "w-full min-w-0 rounded-md border border-input bg-card px-4 py-[15px] text-base leading-[19px] text-foreground transition-colors outline-none placeholder:text-placeholder focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-0 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
