# Petasos landing page

The marketing site for Petasos for Subrogation. It's a single static page built with Vite, React,
TypeScript, Tailwind v4 and shadcn/ui, and hosted on GitHub Pages.

- **Live (pre-domain):** https://charlotte298.github.io/Petasos-web/ (repo: [charlotte298/Petasos-web](https://github.com/charlotte298/Petasos-web))
- **Design source of truth:** `designs/petasos-landing.pen` in the Marine insurance repo, frame
  `PdCYX` "Landing — Desktop". Section frames: Nav `pOplR`, Hero `wnjMa`, Pain Points `m5eab`,
  How It Works `AhemF`, Negotiation `l2xdQ`, Small Files `DEmUi`, Sample Letter `s6SRX3`,
  Beta `SVUyc`, FAQ `hUfSA`, Final CTA `JhUMG`, Footer `yeeXc`.
- **No backend.** Forms post to a Google Apps Script bound to a Google Sheet
  ([docs/forms-setup.md](docs/forms-setup.md)). Analytics use PostHog US cloud
  ([docs/posthog-setup.md](docs/posthog-setup.md)).

## Local development

```bash
pnpm install
cp .env.example .env.local   # fill in what you need; everything is optional
pnpm dev                     # http://localhost:5173/Petasos-web/
```

To exercise the forms without the real Sheet:

```bash
pnpm mock:forms                                   # terminal 1, listens on :8788
VITE_FORMS_ENDPOINT=http://localhost:8788/exec pnpm dev   # terminal 2
```

Other scripts: `pnpm build` (type-checks, then builds to `dist/`), `pnpm preview` (serves
`dist/` under the base path) and `pnpm lint`.

### Environment variables

All of these end up in the public JS bundle. In CI they're GitHub **repo variables**, not
secrets.

| Variable | Purpose | Default |
| --- | --- | --- |
| `VITE_POSTHOG_KEY` | PostHog project API key (`phc_…`). Analytics are off when empty. | — |
| `VITE_POSTHOG_HOST` | PostHog ingestion host | `https://us.i.posthog.com` |
| `VITE_FORMS_ENDPOINT` | Apps Script web app `/exec` URL | — (forms show an error) |
| `VITE_BASE` | Base path the site is served from | `/Petasos-web/` |

`VITE_SITE_URL` optionally overrides the absolute URL used in canonical and Open Graph tags.
When it isn't set, the URL comes from `public/CNAME` if that file exists, and otherwise from
`https://charlotte298.github.io` plus `VITE_BASE`.

## Project layout

```
src/
  components/sections/   one file per design section, in page order
  components/form/       labelled fields, dark-card styles, multi-select, honeypot
  components/ui/         shadcn components, restyled to the .pen tokens
  lib/analytics.ts       PostHog init + typed track()/identify()
  lib/forms.ts           POST to Apps Script
  assets/                photos (WebP, 2× display size) — imported so the base path resolves
apps-script/Code.gs      the Sheet-bound web app
scripts/mock-forms.mjs   local stand-in for the web app
```

Design tokens live in `src/index.css`. They map the .pen variables onto shadcn's CSS variables
(`--background` = bg, `--foreground` = ink, `--primary` = accent, and so on). Two tokens differ
from the .pen on purpose, to meet WCAG AA:

- `--primary-strong` `#C94A22` fills the accent buttons. White text on the design's `#E2572C`
  is 3.7:1, and 15–17px labels need 4.5:1.
- `--placeholder` `#6B757D` replaces the design's `#8A949C` placeholder color, which is 3.1:1 on
  white.

## Deploying

The workflow in `.github/workflows/deploy.yml` runs on every push to `main`. It runs
`pnpm install`, then `pnpm build`, then uploads `dist/` with `actions/upload-pages-artifact`
and publishes it with `actions/deploy-pages`.

One-time setup:

1. Go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
2. Go to **Settings → Secrets and variables → Actions → Variables** and add `VITE_POSTHOG_KEY`,
   `VITE_POSTHOG_HOST` and `VITE_FORMS_ENDPOINT`. Add `VITE_BASE` only when you switch domains
   (see below).
3. Push to `main`, or run the workflow by hand from the **Actions** tab.

The repo is public, which is what lets Pages run on a free GitHub account. (Pages from a
private repo needs a paid plan.) Nothing secret lives in the repo: the three `VITE_` values
are public and ship in the bundle anyway. The base path is case-sensitive: `/Petasos-web/`.

`public/.nojekyll` stops Pages from running Jekyll over the build output.

## Switching to the custom domain

The domain hasn't been chosen yet. When it is:

1. **Add `public/CNAME`** containing just the domain, for example `petasos.example.com`. The
   build copies it into `dist/`, and the canonical and OG URLs pick it up automatically.
2. **Set the repo variable `VITE_BASE=/`**, so assets load from the domain root instead of
   `/Petasos-web/`.
3. **Add DNS records** at the registrar:
   - **Subdomain** (for example `www.` or `petasos.`): a `CNAME` record pointing to
     `charlotte298.github.io`.
   - **Apex domain** (for example `example.com`): the four GitHub Pages `A` records, plus the
     four `AAAA` records for IPv6:
     - `A`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
     - `AAAA`: `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`,
       `2606:50c0:8003::153`
4. **Set the domain in Settings → Pages → Custom domain.** Wait for the DNS check to pass, then
   tick **Enforce HTTPS**. The certificate can take up to about an hour to issue.
5. **Update the OG/canonical URLs.** These follow `public/CNAME` automatically. Set
   `VITE_SITE_URL` only if the canonical URL should differ from the CNAME. Afterwards, check the
   deployed `<head>` and re-scrape a link in a social-card debugger.
6. **Add the domain to PostHog** under Project settings → Authorized URLs.

Then push to `main`, or re-run the workflow.
