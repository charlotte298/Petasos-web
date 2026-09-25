import { useCallback, useRef, useState } from "react"
import { track, type FormName } from "@/lib/analytics"

/** Records render time for the server's 3 s check and fires form_started on first focus. */
export function useFormTracking(form: FormName) {
  const [startedAt] = useState(() => Date.now())
  const started = useRef(false)
  const onFocus = useCallback(() => {
    if (started.current) return
    started.current = true
    track("form_started", { form })
  }, [form])
  return { startedAt, onFocus }
}
