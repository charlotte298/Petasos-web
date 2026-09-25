import type * as React from "react"
import type { UseFormRegisterReturn } from "react-hook-form"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export type Tone = "light" | "dark"

/** Field fills for the dark beta card: white/6 fill, white/20 stroke, white/50 placeholder. */
export const darkControl =
  "border-white/20 bg-white/[0.063] text-white placeholder:text-white/50 data-placeholder:text-white/50 aria-invalid:border-[#ff8a66] [&_[data-slot=select-chevron]]:text-night-muted"

type Props = {
  id: string
  label: string
  error?: string
  tone?: Tone
  className?: string
  children: React.ReactNode
}

export function FormField({ id, label, error, tone = "light", className, children }: Props) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <Label
        htmlFor={id}
        className={cn("text-sm leading-[17px] font-medium", tone === "dark" ? "text-night-muted" : "text-muted-foreground")}
      >
        {label}
      </Label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className={cn("text-sm", tone === "dark" ? "text-[#ff9f80]" : "text-destructive")}>
          {error}
        </p>
      )}
    </div>
  )
}

/** Invisible to people; bots that fill every field trip the server-side check. */
export function Honeypot({ register }: { register: UseFormRegisterReturn }) {
  return (
    <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
      <label>
        Website
        <input type="text" tabIndex={-1} autoComplete="off" className="ph-no-capture" {...register} />
      </label>
    </div>
  )
}
