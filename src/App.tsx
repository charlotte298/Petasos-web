import { Beta } from "@/components/sections/beta"
import { Faq } from "@/components/sections/faq"
import { FinalCta } from "@/components/sections/final-cta"
import { Footer } from "@/components/sections/footer"
import { Hero } from "@/components/sections/hero"
import { HowItWorks } from "@/components/sections/how-it-works"
import { Nav } from "@/components/sections/nav"
import { Negotiation } from "@/components/sections/negotiation"
import { PainPoints } from "@/components/sections/pain-points"
import { SampleLetter } from "@/components/sections/sample-letter"
import { SmallFiles } from "@/components/sections/small-files"
import { Toaster } from "@/components/ui/sonner"

export default function App() {
  return (
    <>
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-card px-4 py-2 focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <Nav />
      <main id="main">
        <Hero />
        <PainPoints />
        <HowItWorks />
        <Negotiation />
        <SmallFiles />
        <SampleLetter />
        <Beta />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <Toaster position="bottom-center" richColors={false} />
    </>
  )
}
