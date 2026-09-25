import { ClipboardCheck, Mail, PhoneOutgoing } from "lucide-react"
import { Section, SectionTitle } from "@/components/section"
import { cn } from "@/lib/utils"

const STEPS = [
  { icon: Mail, title: "CC Amy on the claim email.", body: "You don't need a new portal or a CRM." },
  {
    icon: ClipboardCheck,
    title: "Amy builds the package.",
    body: "It chases missing documents and gives you a go or no-go with the reason.",
  },
  {
    icon: PhoneOutgoing,
    title: "Amy reports, demands and follows up.",
    body: "You're notified as soon as the other carrier replies.",
  },
]

export function HowItWorks() {
  return (
    <Section name="how_it_works" id="how-it-works" className="bg-night py-20 md:py-28">
      <div className="flex flex-col gap-12 md:gap-16">
        <SectionTitle className="text-white">How it works</SectionTitle>
        <ol className="grid grid-cols-1 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <li
              key={title}
              className={cn(
                "flex flex-col gap-5 py-8 md:pt-8 md:pr-10 md:pb-2",
                // The .pen draws 1px white/15 rules between steps: vertical on desktop, horizontal when stacked.
                i > 0 && "border-t border-white/15 md:border-t-0 md:border-l md:pl-10",
                i === 0 && "pt-0 md:pt-8",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm leading-[17px] font-semibold tracking-[0.5px] text-night-muted">Step {i + 1}</span>
                <Icon className="size-6 text-white" aria-hidden />
              </div>
              <h3 className="font-heading text-[26px] leading-[1.2] font-medium text-white md:text-[28px]">{title}</h3>
              <p className="text-[17px] leading-[1.6] text-night-muted">{body}</p>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  )
}
