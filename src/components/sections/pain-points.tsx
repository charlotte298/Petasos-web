import { Check, X } from "lucide-react"
import type * as React from "react"
import paperwork from "@/assets/paperwork.webp"
import phone from "@/assets/phone.webp"
import { Section, SectionTitle } from "@/components/section"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

function PainCopy({ n, title, problem, solution }: { n: number; title: string; problem: string; solution: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-5">
      <p className="font-heading text-xl leading-6 font-semibold text-primary-strong">Time-waster #{n}</p>
      <h3 className="font-heading text-[28px] leading-[1.15] font-medium tracking-[-0.5px] text-foreground md:text-[36px]">
        {title}
      </h3>
      <p className="text-[17px] leading-[1.6] text-muted-foreground md:text-lg">{problem}</p>
      <p className="border-l-[3px] border-foreground py-1 pl-5 text-[17px] leading-[1.6] text-foreground md:text-lg">
        {solution}
      </p>
    </div>
  )
}

function Row({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-10 md:flex-row md:items-center md:gap-12 lg:gap-[72px]", className)} {...props} />
}

function Photo({ src, alt }: { src: string; alt: string }) {
  return (
    <img
      src={src}
      alt={alt}
      width={560}
      height={440}
      loading="lazy"
      decoding="async"
      className="aspect-[560/440] w-full rounded-sm object-cover md:w-[46%] md:shrink-0 xl:w-[560px]"
    />
  )
}

const CHECKS = [
  { ok: true, text: "Damage is documented and paid" },
  { ok: true, text: "Liability is established" },
  { ok: true, text: "There's an insured adverse party" },
  { ok: false, text: "There's something to collect" },
]

function ChecklistCard() {
  return (
    <Card className="w-full gap-1 bg-background p-6 sm:p-9 md:w-[46%] md:shrink-0 xl:w-[560px]">
      <p className="text-sm leading-[17px] font-semibold tracking-[0.3px] text-muted-foreground">
        Petasos checks every file against your checklist
      </p>
      <ul className="mt-4">
        {CHECKS.map(({ ok, text }) => (
          <li key={text} className="flex items-center gap-3.5 border-b border-border py-[18px]">
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full",
                ok ? "bg-success-tint text-success" : "bg-primary-tint text-primary",
              )}
            >
              {ok ? <Check className="size-[15px]" aria-hidden /> : <X className="size-[15px]" aria-hidden />}
            </span>
            <span className="text-[17px] leading-[22px] text-foreground md:text-lg">
              <span className="sr-only">{ok ? "Passed: " : "Failed: "}</span>
              {text}
            </span>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-2.5 pt-5">
        <span className="rounded-sm bg-foreground px-3.5 py-2 text-[13px] leading-4 font-bold tracking-[1px] text-white">NO</span>
        <span className="text-[15px] leading-[18px] text-muted-foreground">Missing: adverse carrier's policy limits</span>
      </div>
    </Card>
  )
}

export function PainPoints() {
  return (
    <Section name="pain_points" className="bg-card py-20 md:py-28">
      <div className="flex flex-col gap-16 md:gap-24">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-12">
          <SectionTitle className="max-w-[620px] leading-[1.05]">Subrogation can be an overcomplicated waste of time.</SectionTitle>
          <p className="max-w-[420px] text-[17px] leading-[1.5] text-muted-foreground md:text-lg">
            Stop cannibalizing your subro adjuster's week. Petasos takes all three off the desk.
          </p>
        </div>

        {/* Text comes first on mobile, so the photo-left row is reversed when stacked. */}
        <Row className="flex-col-reverse">
          <Photo src={paperwork} alt="Two colleagues reviewing a file on a laptop in an office" />
          <PainCopy
            n={1}
            title="Chasing your insured client for documents"
            problem="Problem: The package arrives without proof of payment, a liability investigation or the other party's insurance details. Someone then spends a week of emails chasing them. Without them, you can't collect."
            solution="The Solution: Petasos reads the file, emails the insured a list of exactly what's missing and keeps following up until it arrives. Each document is filed to the claim as it comes in."
          />
        </Row>

        <Row>
          <PainCopy
            n={2}
            title="Guessing whether your evidence is enough"
            problem="The Problem: Police reports state facts, not fault. A repair estimate isn't proof of payment. If you take a file to arbitration without a real liability investigation, 50/50 is the best you can hope for."
            solution="The Solution: You get a yes or a no. A no names the missing item, so your team stops working files that can't be collected."
          />
          <ChecklistCard />
        </Row>

        <Row>
          <PainCopy
            n={3}
            title="Hours on the phone reporting the claim"
            problem="The Problem: Every carrier does intake differently. You could be spending hours talking to an AI chatbot over the phone, or a rep who doesn't particularly want to be there. Your team reads the same facts from the file to each one, then waits on hold for the next."
            solution="The Solution: Petasos reports the claim to the adverse carrier using the facts already in your file. It then sends the demand and follows up every 10 days until the carrier replies. When it does, Petasos pauses and hands the file back to your adjuster."
          />
          <Photo src={phone} alt="A call-center headset next to a laptop" />
        </Row>
      </div>
    </Section>
  )
}
