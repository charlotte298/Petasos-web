import { useEffect, useRef } from "react"
import { track } from "@/lib/analytics"

/** Fires section_viewed once, the first time the section reaches the upper 60% of the viewport. */
export function useSectionView<T extends HTMLElement>(section: string) {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || !("IntersectionObserver" in window)) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          track("section_viewed", { section })
          io.disconnect()
        }
      },
      { rootMargin: "0px 0px -40% 0px" },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [section])
  return ref
}
