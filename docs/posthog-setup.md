# PostHog setup

Analytics run on **PostHog US cloud** (`https://us.i.posthog.com`). posthog-js loads only
when `VITE_POSTHOG_KEY` is set, and it loads after the page is idle so it stays off the
critical rendering path. With no key, `track()` calls go nowhere. In dev they're also logged to
the console as `[analytics] …`.

## Configure

1. In PostHog, open **Project settings → General** and copy the **Project API key** (`phc_…`).
   The key is public: it's meant to ship in client bundles.
2. Set these as GitHub repo **variables**, not secrets:
   - `VITE_POSTHOG_KEY` = the `phc_…` key
   - `VITE_POSTHOG_HOST` = `https://us.i.posthog.com`
3. In **Settings → Web analytics → Web analytics domains**, add `https://charlotte298.github.io`
   (done 2026-09-25). Add the custom domain as well once it's live.

Init settings, in `src/lib/analytics.ts`: autocapture on, pageview capture on,
`person_profiles: "identified_only"`.

## Custom events

| Event | Properties | Fired when |
| --- | --- | --- |
| `cta_clicked` | `location`, `label` | Any "Join beta" / sample-letter CTA is clicked (`nav`, `hero`, `final_cta`) |
| `form_started` | `form` | First focus inside a form (`beta` or `sample_letter`) |
| `form_submitted` | `form`, `claim_type?`, `loss_state?`, `files_per_month?`, `lines?` | The Sheet accepted the row |
| `form_failed` | `form`, `reason` | Validation failed (`validation`) or the submit failed (`network_error`, `http_…`, `too_fast`, `rejected`, `endpoint_missing`…) |
| `section_viewed` | `section` | A section reaches the top 60% of the viewport, once per page load |
| `faq_toggled` | `question` | An FAQ item is opened or collapsed |

## People

- **Beta signups** are identified after a successful submit:
  `posthog.identify(email, { name, company, role })`. This links the lead to its anonymous
  session history.
- **Sample-letter requests** are *not* identified. Only the form properties above are captured.

Every form payload includes PostHog's `distinct_id`, so a Sheet row can be joined to the
PostHog person or session.

## Privacy

- Every input, select trigger and the honeypot has the `ph-no-capture` class, so autocapture
  never records their values.
- Forms submit with `fetch` (and `method="post"` as a fallback). Values never appear in a URL.
