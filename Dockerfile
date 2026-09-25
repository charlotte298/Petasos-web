# syntax=docker/dockerfile:1

# Build the static site, then serve it with unprivileged nginx on port 8080 (Cloud Run's default).
# The VITE_* values are baked into the public JS bundle at build time, so they are build args,
# not runtime env vars. None of them are secrets.

FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .

# Served from the domain root, not the GitHub Pages /Petasos-web/ subpath.
ARG VITE_BASE=/
# Absolute URL used for canonical and Open Graph tags, e.g. https://subrogation.amyconnects.ai/
ARG VITE_SITE_URL=
ARG VITE_POSTHOG_KEY=
ARG VITE_POSTHOG_HOST=https://us.i.posthog.com
ARG VITE_FORMS_ENDPOINT=
RUN VITE_BASE="$VITE_BASE" VITE_SITE_URL="$VITE_SITE_URL" VITE_POSTHOG_KEY="$VITE_POSTHOG_KEY" \
    VITE_POSTHOG_HOST="$VITE_POSTHOG_HOST" VITE_FORMS_ENDPOINT="$VITE_FORMS_ENDPOINT" pnpm build

FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
