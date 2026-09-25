export function Footer() {
  return (
    <footer className="border-t border-white/12 bg-night px-4 sm:px-10 lg:px-20">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-3 py-8 md:flex-row md:items-center md:justify-between">
        <span className="font-heading text-[22px] leading-[27px] font-semibold text-white">Petasos</span>
        <p className="text-sm leading-[17px] text-night-muted">
          © 2026 Amy Connects. Petasos is not a law firm and does not provide legal advice.
        </p>
      </div>
    </footer>
  )
}
