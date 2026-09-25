import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRight, Calendar, CircleCheck, Loader2 } from "lucide-react"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod/mini"
import { FormField, Honeypot } from "@/components/form/field"
import { useFormTracking } from "@/components/form/use-form-tracking"
import { Section, SectionTitle } from "@/components/section"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { track } from "@/lib/analytics"
import { submitForm } from "@/lib/forms"
import { CLAIM_TYPES, US_STATES } from "@/lib/options"

const schema = z.object({
  email: z.email({ error: "Enter a valid work email." }),
  claim_type: z.enum(CLAIM_TYPES, { error: "Choose a claim type." }),
  loss_state: z.enum(US_STATES, { error: "Choose the loss state." }),
  website: z.string(),
})
type Values = z.infer<typeof schema>

function SampleLetterForm() {
  const [done, setDone] = useState(false)
  const { startedAt, onFocus } = useFormTracking("sample_letter")
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", website: "" },
  })

  const onSubmit = async ({ website, ...fields }: Values) => {
    const res = await submitForm("sample_letter", fields, { startedAt, website })
    if (!res.ok) {
      track("form_failed", { form: "sample_letter", reason: res.reason })
      toast.error("We couldn't send your request. Check your connection and try again.")
      return
    }
    track("form_submitted", { form: "sample_letter", claim_type: fields.claim_type, loss_state: fields.loss_state })
    setDone(true)
  }

  if (done) {
    return (
      <div role="status" className="flex items-start gap-3 rounded-md border border-border bg-card p-5">
        <CircleCheck className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
        <p className="text-[17px] leading-[1.5] text-foreground">
          Thanks — we'll email your sample letter within one business day.
        </p>
      </div>
    )
  }

  return (
    <form
      method="post"
      noValidate
      aria-label="Request a sample demand letter"
      onFocus={onFocus}
      onSubmit={handleSubmit(onSubmit, () => track("form_failed", { form: "sample_letter", reason: "validation" }))}
      className="relative flex flex-col gap-4 pt-2"
    >
      <Honeypot register={register("website")} />
      <FormField id="sl-email" label="Work email (required)" error={errors.email?.message}>
        <Input
          id="sl-email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          className="ph-no-capture"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "sl-email-error" : undefined}
          {...register("email")}
        />
      </FormField>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField id="sl-claim" label="Claim type" error={errors.claim_type?.message}>
          <Controller
            control={control}
            name="claim_type"
            render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <SelectTrigger
                  id="sl-claim"
                  ref={field.ref}
                  onBlur={field.onBlur}
                  className="ph-no-capture"
                  aria-invalid={!!errors.claim_type}
                  aria-describedby={errors.claim_type ? "sl-claim-error" : undefined}
                >
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {CLAIM_TYPES.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
        <FormField id="sl-state" label="Loss state" error={errors.loss_state?.message}>
          <Controller
            control={control}
            name="loss_state"
            render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <SelectTrigger
                  id="sl-state"
                  ref={field.ref}
                  onBlur={field.onBlur}
                  className="ph-no-capture"
                  aria-invalid={!!errors.loss_state}
                  aria-describedby={errors.loss_state ? "sl-state-error" : undefined}
                >
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {US_STATES.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
      </div>
      <Button type="submit" size="lg" disabled={isSubmitting} className="self-stretch sm:self-start">
        Send me a sample letter
        {isSubmitting ? <Loader2 className="animate-spin" aria-hidden /> : <ArrowRight aria-hidden />}
      </Button>
    </form>
  )
}

// Line widths from the .pen preview, as a share of the 424px text column. 0 = paragraph gap.
const LINES = [100, 100, 92, 100, 70, 0, 100, 96, 100, 55, 0, 100, 88, 64]

function LetterPreview() {
  return (
    <Card
      role="img"
      aria-label="Preview of a demand letter citing the Carmack Amendment, with a 30-day response deadline"
      className="w-full max-w-[520px] -rotate-2 gap-3.5 rounded-none p-7 shadow-[0_20px_60px_#13202A22] sm:p-12"
    >
      <p className="font-heading text-xl leading-[1.25] font-semibold text-foreground">
        RE: Subrogation demand, Claim No. 00-0000
      </p>
      <p className="text-sm leading-[1.35] text-muted-foreground">
        Notice of claim under 49 U.S.C. § 14706 (Carmack Amendment)
      </p>
      {LINES.map((w, i) =>
        w === 0 ? (
          <div key={i} className="h-2" />
        ) : (
          <div key={i} className="h-2 rounded-[2px] bg-skeleton" style={{ width: `${w}%` }} />
        ),
      )}
      <div className="flex items-center gap-2.5 rounded-sm bg-primary-tint p-3.5">
        <Calendar className="size-4 shrink-0 text-primary" aria-hidden />
        <span className="text-sm leading-[17px] font-medium text-foreground">Response due within 30 days of receipt</span>
      </div>
    </Card>
  )
}

export function SampleLetter() {
  return (
    <Section name="sample_letter" id="sample-letter" className="overflow-hidden py-20 md:py-28">
      <div className="flex flex-col items-center gap-14 md:flex-row md:gap-12 lg:gap-24">
        <div className="flex w-full min-w-0 flex-1 flex-col gap-6">
          <SectionTitle>Get your free demand letter</SectionTitle>
          <p className="text-[17px] leading-[1.6] text-muted-foreground md:text-lg">
            Enter a few details from a real claim and we'll email you a finished demand letter with the legal citations
            and deadlines for your state.
          </p>
          <SampleLetterForm />
        </div>
        {/* 539px is the rotated card's bounding box in the .pen. */}
        <div className="flex w-full justify-center px-2 sm:px-0 md:w-[42%] md:shrink-0 xl:w-[539px]">
          <LetterPreview />
        </div>
      </div>
    </Section>
  )
}
