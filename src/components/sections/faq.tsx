import { useRef } from "react"
import { Section, SectionTitle } from "@/components/section"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { track } from "@/lib/analytics"

const FAQS = [
  { q: "Do we have to switch systems?", a: "No. Amy works over email. CC it on the claim thread." },
  {
    q: "Does Amy negotiate settlements?",
    a: "No. Amy prepares, reports and follows up. Your adjusters negotiate.",
  },
  {
    q: "What if a file isn't ready?",
    a: "Amy tells you no and lists the missing items. It won't send a demand until the file is complete.",
  },
  {
    q: "Which carriers can Amy report to?",
    a: "Any carrier. Amy also checks whether the adverse carrier belongs to arbitration, so you know early whether the file can go to arbitration or would have to be litigated.",
  },
  {
    q: "Is Amy a law firm?",
    a: "No. Amy doesn't give legal advice, and your team reviews every demand before it goes out.",
  },
]

export function Faq() {
  const openRef = useRef<string[]>([])
  return (
    <Section name="faq" id="faq" className="py-20 md:py-28">
      <div className="flex flex-col gap-10 md:flex-row md:gap-16 lg:gap-24">
        <SectionTitle className="leading-[1.05] md:w-[300px] md:shrink-0 xl:w-[400px]">Questions subro teams ask</SectionTitle>
        {/* All questions start closed; visitors open the ones they care about. */}
        <Accordion
          type="multiple"
          defaultValue={[]}
          className="flex-1 border-t border-border"
          onValueChange={(open) => {
            // Report the question whose state changed.
            const prev = new Set(openRef.current)
            const changed = FAQS.find((f) => prev.has(f.q) !== open.includes(f.q))
            openRef.current = open
            if (changed) track("faq_toggled", { question: changed.q })
          }}
        >
          {FAQS.map(({ q, a }) => (
            <AccordionItem key={q} value={q} className="py-7">
              <AccordionTrigger className="text-lg leading-6 font-semibold text-foreground md:text-xl">{q}</AccordionTrigger>
              <AccordionContent className="pt-2.5 text-[17px] leading-[1.6] text-muted-foreground">{a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Section>
  )
}
