import { Section } from "@/components/section"

export function Negotiation() {
  return (
    <Section name="negotiation" className="py-20 md:py-24">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:gap-12 lg:gap-20">
        <h2 className="font-heading text-[34px] leading-[1.1] font-medium tracking-[-0.8px] text-foreground md:w-[44%] md:shrink-0 md:text-[40px] xl:w-[560px] lg:text-[44px]">
          Negotiation stays with your adjusters.
        </h2>
        <p className="max-w-[640px] text-lg leading-[1.6] text-muted-foreground md:text-xl">
          Amy handles the paperwork and the phone queues. Your adjusters handle the conversation that gets the check
          signed.
        </p>
      </div>
    </Section>
  )
}
