import freightPort from "@/assets/freight-port.webp"
import { Section } from "@/components/section"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export function SmallFiles() {
  return (
    <Section name="small_files" className="pb-20 md:pb-28">
      <div className="flex flex-col md:flex-row">
        <img
          src={freightPort}
          alt="A container port with cranes and stacked shipping containers at dusk"
          width={640}
          height={560}
          loading="lazy"
          decoding="async"
          className="aspect-[640/560] w-full object-cover md:aspect-auto md:h-auto md:w-1/2 md:min-h-[560px]"
        />
        <Card className="flex-1 justify-center gap-7 rounded-none px-6 py-10 sm:px-10 md:min-h-[560px] md:px-12 md:py-16 lg:px-[72px]">
          <h2 className="font-heading text-[34px] leading-[1.1] font-medium tracking-[-0.8px] text-foreground md:text-[40px] lg:text-[44px]">
            Find lost money
          </h2>
          <p className="text-[17px] leading-[1.6] text-muted-foreground md:text-lg">
            A $2,000 demand takes nearly as much work as a $100,000 one. With Petasos doing the reporting and follow-ups,
            you can pursue the whole backlog, not only the large files.
          </p>
          <div className="flex flex-col gap-6">
            <Separator />
            <div className="flex items-center gap-5">
              <span className="font-heading text-[40px] leading-none font-medium whitespace-nowrap text-foreground md:text-[48px]">
                80 min
              </span>
              <span className="text-base leading-[1.5] text-muted-foreground">
                Staff time per demand file, according to Arbitration Forums.
              </span>
            </div>
          </div>
        </Card>
      </div>
    </Section>
  )
}
