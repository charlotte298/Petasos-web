import { Menu } from "lucide-react"
import { useRef, useState } from "react"
import { CtaLink } from "@/components/cta-link"
import { Logo } from "@/components/logo"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

const LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#sample-letter", label: "Sample letter" },
  { href: "#beta", label: "Beta" },
  { href: "#faq", label: "FAQ" },
]

export function Nav() {
  const [open, setOpen] = useState(false)
  // Scroll after the Sheet has closed; scrolling while its scroll lock is active gets cut short.
  const pending = useRef<string | null>(null)
  return (
    <header className="sticky top-0 z-40 bg-background/95 px-4 backdrop-blur-sm supports-[backdrop-filter]:bg-background/85 sm:px-10 lg:px-20">
      <nav aria-label="Main" className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 py-4 md:py-6">
        <a href="#top" aria-label="Amy for Subrogation, back to top" className="flex items-center gap-2.5 rounded-sm">
          <Logo className="h-8 w-auto text-foreground md:h-9" />
          <Badge variant="outline" className="hidden sm:inline-flex">
            for Subrogation
          </Badge>
        </a>

        <ul className="hidden items-center gap-9 lg:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="rounded-sm text-[15px] text-muted-foreground transition-colors hover:text-foreground">
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <CtaLink href="#beta" location="nav" label="Join beta" />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="size-6" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-72 bg-background"
              onCloseAutoFocus={(e) => {
                const hash = pending.current
                if (!hash) return
                pending.current = null
                e.preventDefault()
                history.pushState(null, "", hash)
                document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" })
              }}
            >
              <SheetHeader>
                <SheetTitle className="font-heading text-2xl font-semibold">Amy</SheetTitle>
                <SheetDescription className="sr-only">Jump to a section</SheetDescription>
              </SheetHeader>
              <ul className="flex flex-col px-4">
                {LINKS.map((l) => (
                  <li key={l.href} className="border-b border-border last:border-b-0">
                    <a
                      href={l.href}
                      onClick={(e) => {
                        e.preventDefault()
                        pending.current = l.href
                        setOpen(false)
                      }}
                      className="block py-4 text-lg text-foreground"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  )
}
