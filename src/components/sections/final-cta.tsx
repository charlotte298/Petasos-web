import { ArrowRight } from "lucide-react"
import { CtaLink } from "@/components/cta-link"
import { Section } from "@/components/section"

export function FinalCta() {
  return (
    <Section name="final_cta" className="bg-night py-24 md:py-32">
      <div className="flex flex-col items-center gap-10">
        <h2 className="max-w-[900px] text-center font-heading text-[40px] leading-[1.08] font-medium tracking-[-1px] text-white md:text-[52px] lg:text-[60px] lg:tracking-[-1.2px]">
          Stop waiting on hold, start recovering
        </h2>
        <CtaLink href="#beta" location="final_cta" label="Join the beta" variant="onDark" size="xl">
          Join the beta
          <ArrowRight aria-hidden />
        </CtaLink>
      </div>
    </Section>
  )
}
