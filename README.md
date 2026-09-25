# Amy landing page

The marketing site for Amy for Subrogation. It's a single static page built with Vite, React,
TypeScript, Tailwind v4 and shadcn/ui, and hosted on GitHub Pages.

- **Live (pre-domain):** https://charlotte298.github.io/Petasos-web/ (repo: [charlotte298/Petasos-web](https://github.com/charlotte298/Petasos-web))
- **Design source of truth:** [`designs/petasos-landing.pen`](designs/) (open in [Pencil](https://pen.dev)), frame
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
Dockerfile               builds the site and serves it with nginx on :8080
docker/nginx.conf        caching, gzip, security headers, /healthz
infra/                   Pulumi (Python) deployment to Cloud Run on www.amyconnects.ai
```

Design tokens live in `src/index.css`. They follow the Amy Connects brand from the Amy app
(`amyconnects-infra`): background `#F4F2EE`, ink `#1C1718`, coral `#FF6B4A`, Poppins headings and
DM Sans body text, mapped onto shadcn's CSS variables. Two tokens exist to meet WCAG AA:

- `--primary-strong` `#C03C1C` fills buttons and colors small coral text. White text on Amy's
  `#FF6B4A` is only 2.8:1, and 15–17px labels need 4.5:1.
- `--placeholder` `#6B6464` is used for input placeholders (5.6:1 on the card color).

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

## Docker

The `Dockerfile` builds the site with `VITE_BASE=/` and serves `dist/` from unprivileged nginx
on port 8080. The `VITE_` values are build args because Vite bakes them into the bundle.

```sh
docker build -t amy-landing \
  --build-arg VITE_SITE_URL=https://www.amyconnects.ai/ \
  --build-arg VITE_POSTHOG_KEY=phc_... \
  --build-arg VITE_FORMS_ENDPOINT=https://script.google.com/macros/s/.../exec .
docker run --rm -p 8080:8080 amy-landing   # http://localhost:8080, health check at /healthz
```

`/assets/*` (fingerprinted) is cached for a year. Everything else, including `index.html`,
revalidates on every request so deploys show up immediately.

## Deploying to Google Cloud (Cloud Run + Pulumi)

`infra/` is a Pulumi Python project. One `pulumi up` does all of this:

1. Builds the Dockerfile for `linux/amd64` (this works from Apple Silicon) and pushes it to
   Artifact Registry (`us-central1-docker.pkg.dev/amyconnects/amy-landing`).
2. Deploys it to Cloud Run (`amy-landing`, scale to zero, max 3 instances) by image digest, so
   every build is a new revision.
3. Puts it on `www.amyconnects.ai` and creates the DNS records in the `amyconnects` Cloud DNS
   zone. In the default `loadbalancer` mode, the bare `amyconnects.ai` also points at the load
   balancer and 301-redirects to `https://www.amyconnects.ai`, keeping the path and query.

This uses **Cloud Run, not Cloud Functions.** Cloud Functions deploys source code, not a
container image, and 2nd-gen functions run on Cloud Run underneath anyway. For a static site in
a Docker image, Cloud Run is the right service.

### Domain modes

Set with `pulumi config set domainMode <mode>`:

- **`loadbalancer`** (default): a global external HTTPS load balancer with a Google-managed
  certificate, Cloud CDN, and an HTTP→HTTPS redirect. Cloud Run only accepts traffic from the
  load balancer. It also handles the apex redirect. You don't need to verify domain ownership. It
  costs about $18/month for the forwarding rules.
- **`mapping`**: a Cloud Run domain mapping plus a `CNAME` to `ghs.googlehosted.com`. There's no
  load balancer cost, but the account running `pulumi up` must be a **verified owner** of
  `amyconnects.ai` in Google Search Console (`gcloud domains verify amyconnects.ai`). This mode
  doesn't redirect the bare domain.

The Google-managed certificate goes active only after the DNS record resolves. That usually
takes 15–60 minutes after the first `pulumi up`. Until then, HTTPS on the domain fails.

### First deploy

No `pulumi login` and no Pulumi Cloud account. `infra/Pulumi.yaml` points the state at a GCS
bucket in the `amyconnects` project, and secrets in that state are encrypted with Cloud KMS.
Everything uses your normal `gcloud` credentials.

```sh
cd infra
gcloud auth application-default login          # Pulumi uses Application Default Credentials
./bootstrap.sh                                 # once: state bucket, KMS key, "prod" stack
git add Pulumi.prod.yaml && git commit -m "chore(infra): init prod stack"   # keep the KMS key lines
pulumi config set posthogKey phc_...
pulumi config set formsEndpoint https://script.google.com/macros/s/.../exec
pulumi up
```

`bootstrap.sh` is safe to re-run. It creates the private, versioned bucket
`gs://amyconnects-pulumi-state` and the KMS key `pulumi/amy-landing`, then runs
`pulumi stack init prod --secrets-provider gcpkms://…`. That writes `secretsprovider` and
`encryptedkey` into `Pulumi.prod.yaml`, and anyone else deploying needs those lines, so commit
them. After that, anyone with access to the bucket and the key can run `pulumi up`; nobody
else needs the bootstrap.

Redeploy after code changes by running `pulumi up` again. Docker must be running, because the
image is built locally.

Other config (see `Pulumi.prod.yaml`): `domain`, `dnsZone`, `serviceName`, `minInstances`
(set to 1 to avoid cold starts) and `maxInstances`.

The deploying account needs roughly these roles on the `amyconnects` project: Cloud Run Admin,
Artifact Registry Administrator, DNS Administrator, Service Usage Admin, Service Account User,
(for the `loadbalancer` mode) Compute Load Balancer Admin, and for the state backend Storage
Object Admin on the state bucket plus Cloud KMS CryptoKey Encrypter/Decrypter on the key. The
bootstrap also needs Storage Admin and Cloud KMS Admin. Making the service public
(`allUsers` gets `roles/run.invoker`) fails if an organization policy restricts public
members.

## Switching to the custom domain

The domain hasn't been chosen yet. When it is:

1. **Add `public/CNAME`** containing just the domain, for example `amy.example.com`. The
   build copies it into `dist/`, and the canonical and OG URLs pick it up automatically.
2. **Set the repo variable `VITE_BASE=/`**, so assets load from the domain root instead of
   `/Petasos-web/`.
3. **Add DNS records** at the registrar:
   - **Subdomain** (for example `www.` or `amy.`): a `CNAME` record pointing to
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
6. **Add the domain to PostHog** under Settings → Web analytics → Web analytics domains.

Then push to `main`, or re-run the workflow.
