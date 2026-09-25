import { distinctId, type FormName } from "@/lib/analytics"

const endpoint = import.meta.env.VITE_FORMS_ENDPOINT

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const

function utmParams() {
  const params = new URLSearchParams(window.location.search)
  return Object.fromEntries(UTM_KEYS.map((k) => [k, params.get(k) ?? ""]))
}

export type SubmitResult = { ok: true } | { ok: false; reason: string }

/**
 * Posts a form to the Apps Script web app. text/plain keeps this a CORS simple
 * request (no preflight), and the JSON reply stays readable after Apps Script's
 * redirect to googleusercontent.com.
 */
export async function submitForm(
  form: FormName,
  fields: Record<string, string | string[]>,
  meta: { startedAt: number; website: string },
): Promise<SubmitResult> {
  if (!endpoint) return { ok: false, reason: "endpoint_missing" }
  const payload = {
    form,
    ...fields,
    website: meta.website, // honeypot
    startedAt: meta.startedAt,
    page_url: window.location.origin + window.location.pathname,
    ...utmParams(),
    distinct_id: distinctId() ?? "",
  }
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "text/plain;charset=utf-8" },
    })
    if (!res.ok) return { ok: false, reason: `http_${res.status}` }
    const data = (await res.json()) as { ok?: boolean; error?: string }
    return data.ok ? { ok: true } : { ok: false, reason: data.error || "rejected" }
  } catch {
    return { ok: false, reason: "network_error" }
  }
}
