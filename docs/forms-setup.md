# Forms → Google Sheet setup

Both forms on the page (the beta application and the sample-letter request) post to a
Google Apps Script web app. The script is bound to a Google Sheet and appends one row per
submission. There is no other backend.

## 1. Create the Sheet

1. Create a new Google Sheet in the Amy Drive, for example **Amy — landing page leads**.
2. You don't need to add tabs or headers. The script creates a `beta` tab and a
   `sample_letter` tab, each with a bold, frozen header row, the first time that form is
   submitted.

## 2. Add the script

1. In the Sheet, open **Extensions → Apps Script**.
2. Delete the placeholder `Code.gs` contents and paste in [`apps-script/Code.gs`](../apps-script/Code.gs)
   from this repo.
3. Save the file. Naming the project something like "Amy forms" makes it easier to find later.

## 3. Deploy as a web app

1. Click **Deploy → New deployment**.
2. Under **Select type** (the gear icon), choose **Web app**.
3. Set **Execute as** to **Me**. The script writes to the Sheet with your permissions.
4. Set **Who has access** to **Anyone**. Visitors aren't signed in to Google, so any other
   setting makes every submission fail.
5. Click **Deploy** and approve the permission prompt. It asks for access to the spreadsheet
   the script is bound to.
6. Copy the **Web app URL**. It ends in `/exec`.

You can check the deployment by opening that URL in a browser. It should return
`{"ok":true,"service":"petasos-forms"}`.

## 4. Point the site at it

- **Production:** in GitHub, open **Settings → Secrets and variables → Actions → Variables**
  and set `VITE_FORMS_ENDPOINT` to the `/exec` URL. Use a repo *variable*, not a secret.
  Then re-run the deploy workflow, or push to `main`.
- **Local dev:** put the URL in `.env.local` as `VITE_FORMS_ENDPOINT=…` and restart `pnpm dev`.

To work on the forms without touching the real Sheet, run `pnpm mock:forms` and set
`VITE_FORMS_ENDPOINT=http://localhost:8788/exec`. The mock applies the same checks as the
real script and lists the rows it has received at `http://localhost:8788/rows`.

## Editing the script later

**Every change to `Code.gs` needs a new deployment version.** Saving the file does not update
the live `/exec` URL. After you edit:

1. Open **Deploy → Manage deployments**.
2. Select the existing web app deployment and click the pencil icon (**Edit**).
3. Under **Version**, choose **New version** and click **Deploy**.

Editing the existing deployment keeps the same `/exec` URL. **New deployment** would create
a different URL, and you'd then have to update `VITE_FORMS_ENDPOINT` and redeploy the site.

Keep `apps-script/Code.gs` in this repo in sync with what's deployed.

## What gets stored

Each row holds:

- a server timestamp
- every field of the form. Multi-select values are joined with `, `.
- `page_url`
- `utm_source`, `utm_medium`, `utm_campaign`, `utm_term` and `utm_content`
- `distinct_id`: the visitor's PostHog ID, which you can use to join a row to the PostHog
  session. It's empty when analytics is disabled.

Values that start with `=`, `+`, `-` or `@` are prefixed with `'` so the Sheet never
evaluates them as formulas.

## How the request works

The client sends `POST` with `Content-Type: text/plain;charset=utf-8` and a JSON body.
`text/plain` makes it a CORS "simple request", so the browser sends no preflight. Apps Script
couldn't answer a preflight anyway. Apps Script replies with a 302 redirect to
`script.googleusercontent.com`. `fetch` follows the redirect, and the page can read the JSON
`{ok: true}` or `{ok: false, error}`.

The client doesn't use `mode: "no-cors"`, because that hides the response and makes failures
undetectable. Any non-ok reply or network error shows an error toast and keeps what the visitor
typed.

## Spam: what protects this endpoint (and what doesn't)

**The `/exec` URL ships in the public JavaScript bundle.** Anyone can find it and post to it
directly. There's no API key, no auth and no rate limit. The only defenses are these two checks
in `doPost`:

1. **Honeypot.** A hidden `website` field that people never see. If it has a value, the
   request is rejected.
2. **Timing.** The client sends `startedAt`, the time the page rendered. A submit less than
   3 seconds later is rejected.

Together these stop naive form-filling bots. They won't stop someone who reads the bundle and
scripts requests on purpose. If spam starts landing in the Sheet, the next steps are to add
Cloudflare Turnstile or reCAPTCHA and verify the token in `doPost`, or to put a small proxy in
front of the script.
