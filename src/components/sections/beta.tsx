import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRight, Check, CircleCheck, Loader2 } from "lucide-react"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod/mini"
import team from "@/assets/team.webp"
import { darkControl, FormField, Honeypot } from "@/components/form/field"
import { MultiSelect } from "@/components/form/multi-select"
import { useFormTracking } from "@/components/form/use-form-tracking"
import { Section, SectionTitle } from "@/components/section"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { identify, track } from "@/lib/analytics"
import { submitForm } from "@/lib/forms"
import { FILES_PER_MONTH, LINES, TIME_SINKS } from "@/lib/options"
import { cn } from "@/lib/utils"

const required = (error: string) => z.string().check(z.trim(), z.minLength(1, { error }))

const schema = z.object({
  name: required("Enter your name."),
  email: z.email({ error: "Enter a valid work email." }),
  company: required("Enter your company."),
  role: z.string().check(z.trim()),
  files_per_month: z.enum(FILES_PER_MONTH, { error: "Choose a range." }),
  lines: z.array(z.enum(LINES)).check(z.minLength(1, { error: "Pick at least one line." })),
  time_sink: z.enum(TIME_SINKS, { error: "Choose one." }),
  website: z.string(),
})
type Values = z.infer<typeof schema>

const GET = ["Early access", "A solution custom-built for you", "Launch pricing locked in"]
const ASK = ["A handful of closed or stalled files to test against", "30 minutes of feedback every two weeks"]

function List({ heading, items, icon: Icon }: { heading: string; items: string[]; icon: typeof Check }) {
  return (
    <div className="flex flex-1 flex-col gap-3.5">
      <h3 className="text-[15px] leading-[18px] font-bold tracking-[0.3px] text-foreground">{heading}</h3>
      <ul className="flex flex-col gap-3.5">
        {items.map((t) => (
          <li key={t} className="flex gap-2.5">
            <Icon className="mt-[2px] size-[18px] shrink-0 text-foreground" aria-hidden />
            <span className="text-base leading-[1.45] text-muted-foreground">{t}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function DarkSelect({
  id,
  options,
  value,
  onChange,
  onBlur,
  invalid,
  inputRef,
}: {
  id: string
  options: readonly string[]
  value: string | undefined
  onChange: (v: string) => void
  onBlur: () => void
  invalid: boolean
  inputRef: React.Ref<HTMLButtonElement>
}) {
  return (
    <Select value={value ?? ""} onValueChange={onChange}>
      <SelectTrigger
        id={id}
        ref={inputRef}
        onBlur={onBlur}
        className={cn("ph-no-capture", darkControl)}
        aria-invalid={invalid}
        aria-describedby={invalid ? `${id}-error` : undefined}
      >
        <SelectValue placeholder="Select…" />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function BetaForm() {
  const [done, setDone] = useState(false)
  const { startedAt, onFocus } = useFormTracking("beta")
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", company: "", role: "", lines: [], website: "" },
  })

  const onSubmit = async ({ website, ...fields }: Values) => {
    const res = await submitForm("beta", fields, { startedAt, website })
    if (!res.ok) {
      track("form_failed", { form: "beta", reason: res.reason })
      toast.error("We couldn't send your application. Check your connection and try again.")
      return
    }
    track("form_submitted", { form: "beta", files_per_month: fields.files_per_month, lines: fields.lines })
    identify(fields.email, { name: fields.name, company: fields.company, role: fields.role || undefined })
    setDone(true)
  }

  const text = (id: string, name: "name" | "email" | "company" | "role", label: string, placeholder: string, extra = {}) => (
    <FormField id={id} label={label} tone="dark" error={errors[name]?.message}>
      <Input
        id={id}
        placeholder={placeholder}
        className={cn("ph-no-capture", darkControl)}
        aria-invalid={!!errors[name]}
        aria-describedby={errors[name] ? `${id}-error` : undefined}
        {...extra}
        {...register(name)}
      />
    </FormField>
  )

  return (
    <Card className="w-full gap-[18px] rounded-lg bg-night p-6 text-white sm:p-11 lg:w-[48%] lg:shrink-0 xl:w-[560px]">
      {done ? (
        <div role="status" className="flex flex-col gap-4 py-6">
          <CircleCheck className="size-8 text-[#7fd09c]" aria-hidden />
          <h3 className="font-heading text-[28px] leading-[1.2] font-medium">Thanks for applying</h3>
          <p className="text-[17px] leading-[1.6] text-night-muted">
            We read every application and will reply by email within a few business days to set up a first call.
          </p>
        </div>
      ) : (
        <form
          method="post"
          noValidate
          aria-labelledby="beta-form-title"
          onFocus={onFocus}
          onSubmit={handleSubmit(onSubmit, () => track("form_failed", { form: "beta", reason: "validation" }))}
          className="relative flex flex-col gap-[18px]"
        >
          <h3 id="beta-form-title" className="font-heading text-[28px] leading-[1.2] font-medium">
            Apply for the beta
          </h3>
          <Honeypot register={register("website")} />
          <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 sm:gap-3.5">
            {text("b-name", "name", "Name", "Jane Smith", { autoComplete: "name" })}
            {text("b-email", "email", "Work email", "jane@company.com", { type: "email", autoComplete: "email" })}
          </div>
          <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 sm:gap-3.5">
            {text("b-company", "company", "Company", "Company name", { autoComplete: "organization" })}
            {text("b-role", "role", "Role", "Subrogation manager", { autoComplete: "organization-title" })}
          </div>
          <FormField id="b-files" label="Subrogation files per month" tone="dark" error={errors.files_per_month?.message}>
            <Controller
              control={control}
              name="files_per_month"
              render={({ field }) => (
                <DarkSelect
                  id="b-files"
                  options={FILES_PER_MONTH}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  invalid={!!errors.files_per_month}
                  inputRef={field.ref}
                />
              )}
            />
          </FormField>
          <FormField id="b-lines" label="Lines you handle" tone="dark" error={errors.lines?.message}>
            <Controller
              control={control}
              name="lines"
              render={({ field }) => (
                <MultiSelect
                  id="b-lines"
                  options={LINES}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="Select all that apply…"
                  invalid={!!errors.lines}
                  describedBy={errors.lines ? "b-lines-error" : undefined}
                  className={darkControl}
                />
              )}
            />
          </FormField>
          <FormField id="b-sink" label="Biggest time sink" tone="dark" error={errors.time_sink?.message}>
            <Controller
              control={control}
              name="time_sink"
              render={({ field }) => (
                <DarkSelect
                  id="b-sink"
                  options={TIME_SINKS}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  invalid={!!errors.time_sink}
                  inputRef={field.ref}
                />
              )}
            />
          </FormField>
          <Button type="submit" variant="onDark" size="lg" disabled={isSubmitting} className="w-full">
            Apply for the beta
            {isSubmitting ? <Loader2 className="animate-spin" aria-hidden /> : <ArrowRight aria-hidden />}
          </Button>
        </form>
      )}
    </Card>
  )
}

export function Beta() {
  return (
    <Section name="beta" id="beta" className="bg-card py-20 md:py-28">
      <div className="flex flex-col gap-12 lg:flex-row lg:gap-12 xl:gap-20">
        <div className="flex min-w-0 flex-1 flex-col gap-7">
          <SectionTitle className="leading-[1.05]">
            Join the <span className="whitespace-nowrap">design-partner</span> beta
          </SectionTitle>
          <p className="text-[17px] leading-[1.6] text-muted-foreground md:text-lg">
            We're looking for subrogation teams to help shape Amy
          </p>
          <img
            src={team}
            alt="Four colleagues planning together at a whiteboard"
            width={640}
            height={240}
            loading="lazy"
            decoding="async"
            className="h-[200px] w-full rounded-sm object-cover sm:h-[240px]"
          />
          <div className="flex flex-col gap-8 sm:flex-row sm:gap-10">
            <List heading="You get" items={GET} icon={Check} />
            <List heading="We ask for" items={ASK} icon={ArrowRight} />
          </div>
        </div>
        <BetaForm />
      </div>
    </Section>
  )
}
