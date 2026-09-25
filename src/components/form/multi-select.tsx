import { ChevronDown } from "lucide-react"
import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type Props = {
  id: string
  options: readonly string[]
  value: string[]
  onChange: (value: string[]) => void
  onBlur?: () => void
  placeholder: string
  invalid?: boolean
  describedBy?: string
  className?: string
}

/** Multi-select built from Popover + Command; the trigger lists selections comma-separated. */
export function MultiSelect({ id, options, value, onChange, onBlur, placeholder, invalid, describedBy, className }: Props) {
  const [open, setOpen] = useState(false)
  const toggle = (opt: string) =>
    onChange(value.includes(opt) ? value.filter((v) => v !== opt) : options.filter((o) => o === opt || value.includes(o)))

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) onBlur?.()
      }}
    >
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          data-placeholder={value.length === 0 ? "" : undefined}
          className={cn(
            "ph-no-capture flex w-full items-center justify-between gap-2 rounded-md border border-input bg-card px-4 py-[15px] text-left text-base leading-[19px] text-foreground outline-none focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-0 focus-visible:outline-ring aria-invalid:border-destructive data-placeholder:text-placeholder",
            className,
          )}
        >
          <span className="truncate">{value.length ? value.join(", ") : placeholder}</span>
          <ChevronDown data-slot="select-chevron" className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) p-0">
        <Command className="rounded-md!">
          <CommandList>
            <CommandGroup>
              {options.map((opt) => {
                const checked = value.includes(opt)
                return (
                  <CommandItem
                    key={opt}
                    value={opt}
                    data-checked={checked}
                    aria-selected={checked}
                    onSelect={() => toggle(opt)}
                    className="gap-3 px-2.5 py-2.5 text-[15px] data-selected:bg-primary-tint [&>svg:last-child]:hidden"
                  >
                    <Checkbox checked={checked} tabIndex={-1} aria-hidden className="pointer-events-none" />
                    {opt}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
