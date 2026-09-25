import { ArrowRight, Check, Phone, Timer } from "lucide-react"
import heroTruck from "@/assets/hero-truck.webp"
import heroTruck640 from "@/assets/hero-truck-640.webp"
import { CtaLink } from "@/components/cta-link"
import { Section } from "@/components/section"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const STEPS = [
  { icon: Check, text: "Documents collected from insured", tone: "success" },
  { icon: Check, text: "Evidence check passed: 4 of 4", tone: "success" },
  { icon: Phone, text: "Reported to adverse carrier", tone: "success" },
  { icon: Timer, text: "Follow-up scheduled in 10 days", tone: "accent" },
] as const

export function Hero() {
  return (
    <Section name="hero" id="top" className="pt-6 pb-16 md:pt-14 md:pb-24">
      <div className="flex flex-col-reverse gap-10 md:flex-row md:items-center md:gap-10 lg:gap-16">
        <div className="flex min-w-0 flex-1 flex-col gap-7">
          <h1 className="font-heading text-[46px] leading-[1.02] font-medium tracking-[-1px] text-foreground sm:text-[58px] md:text-[52px] lg:text-[64px] xl:text-[76px] xl:tracking-[-1.5px]">
            Subrogation made simple
          </h1>
          <p className="max-w-[540px] text-lg leading-[1.5] text-muted-foreground md:text-xl">
            Amy collects the documents from your insured, tells you whether the file has enough to win, and reports
            the claim to the adverse carrier.
          </p>
          <div className="flex flex-col gap-3.5 sm:flex-row sm:flex-wrap sm:items-center">
            <CtaLink href="#beta" location="hero" label="Join beta" size="lg">
              Join beta
              <ArrowRight aria-hidden />
            </CtaLink>
            <CtaLink
              href="#sample-letter"
              location="hero"
              label="Get a free sample demand letter"
              variant="outline"
              size="lg"
              className="whitespace-normal"
            />
          </div>
        </div>

        <div className="relative w-full md:w-[46%] md:shrink-0 xl:w-[560px]">
          <img
            src={heroTruck}
            srcSet={`${heroTruck640} 640w, ${heroTruck} 1120w`}
            sizes="(min-width: 1280px) 560px, (min-width: 768px) 46vw, 100vw"
            alt="A white semi truck parked on an open lot under a blue sky"
            width={560}
            height={620}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="aspect-[560/620] w-full rounded-sm object-cover"
          />
          <Card
            aria-label="Example claim status"
            className="relative z-10 mx-4 -mt-20 gap-4 p-5 shadow-[0_12px_40px_#1C171826] sm:absolute sm:bottom-4 sm:left-4 sm:mx-0 sm:mt-0 sm:w-[340px] sm:p-6 md:bottom-auto md:-left-14 md:top-[62.6%]"
          >
            <p className="text-[13px] leading-4 font-semibold tracking-[0.4px] text-muted-foreground">Claim #SUB-2041</p>
            <ul className="flex flex-col gap-4">
              {STEPS.map(({ icon: Icon, text, tone }) => (
                <li key={text} className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex size-[26px] shrink-0 items-center justify-center rounded-full",
                      tone === "success" ? "bg-success-tint text-success" : "bg-primary-tint text-primary",
                    )}
                  >
                    <Icon className="size-3.5" aria-hidden />
                  </span>
                  <span className="text-[15px] leading-[18px] text-foreground">{text}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </Section>
  )
}
