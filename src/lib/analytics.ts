import type { PostHog } from "posthog-js"

const key = import.meta.env.VITE_POSTHOG_KEY
const host = import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com"

let ph: PostHog | null = null
// Events fired before posthog-js finishes loading are replayed once it's ready.
const queue: Array<(p: PostHog) => void> = []

function run(fn: (p: PostHog) => void) {
  if (ph) fn(ph)
  else if (key) queue.push(fn)
}

/** Loads posthog-js off the critical path, only when VITE_POSTHOG_KEY is set. */
export function initAnalytics() {
  if (!key) return
  const load = () =>
    import("posthog-js").then(({ default: posthog }) => {
      posthog.init(key, {
        api_host: host,
        person_profiles: "identified_only",
        autocapture: true,
        capture_pageview: true,
      })
      ph = posthog
      queue.splice(0).forEach((fn) => fn(posthog))
    })
  if ("requestIdleCallback" in window) requestIdleCallback(load, { timeout: 3000 })
  else setTimeout(load, 1500)
}

export type FormName = "beta" | "sample_letter"

type Events = {
  cta_clicked: { location: string; label: string }
  form_started: { form: FormName }
  form_submitted: {
    form: FormName
    claim_type?: string
    loss_state?: string
    files_per_month?: string
    lines?: string[]
  }
  form_failed: { form: FormName; reason: string }
  section_viewed: { section: string }
  faq_toggled: { question: string }
}

export function track<E extends keyof Events>(event: E, props: Events[E]) {
  if (import.meta.env.DEV) console.debug("[analytics]", event, props)
  run((p) => p.capture(event, props))
}

export function identify(email: string, props: { name: string; company: string; role?: string }) {
  run((p) => p.identify(email, props))
}

export function distinctId(): string | null {
  return ph ? ph.get_distinct_id() : null
}
