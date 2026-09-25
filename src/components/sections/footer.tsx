import { Logo } from "@/components/logo"

export function Footer() {
  return (
    <footer className="border-t border-white/12 bg-night px-4 sm:px-10 lg:px-20">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-3 py-8 md:flex-row md:items-center md:justify-between">
        <Logo className="h-8 w-auto text-white" />
        <p className="text-sm leading-[17px] text-night-muted">
          © 2026 Amy Connects. Amy is not a law firm and does not provide legal advice.
        </p>
      </div>
    </footer>
  )
}
