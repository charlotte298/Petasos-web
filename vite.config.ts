import fs from 'node:fs'
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // GitHub Pages project site lives under /petasos-landing/. Set VITE_BASE=/ for a custom domain.
  const base = env.VITE_BASE || '/petasos-landing/'
  // Absolute URL for canonical/OG tags: VITE_SITE_URL, else the domain in public/CNAME, else github.io.
  const cname = fs.existsSync('public/CNAME') ? fs.readFileSync('public/CNAME', 'utf8').trim() : ''
  const siteUrl = (
    env.VITE_SITE_URL || (cname ? `https://${cname}/` : `https://amyconnects.github.io${base}`)
  ).replace(/\/?$/, '/')
  return {
    base,
    plugins: [
      react(),
      tailwindcss(),
      { name: 'site-url', transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', siteUrl) },
      {
        // Preload the hero photo (the LCP element) and the two Latin font files so they
        // start downloading before the JS bundle has parsed.
        name: 'preload-critical',
        apply: 'build',
        transformIndexHtml(_html, ctx) {
          const files = Object.keys(ctx.bundle ?? {})
          const pick = (re: RegExp) => files.find((f) => re.test(f))
          const hero = pick(/hero-truck-(?!640).*\.webp$/)
          const hero640 = pick(/hero-truck-640-.*\.webp$/)
          const fonts = [pick(/inter-latin-wght-normal-.*\.woff2$/), pick(/fraunces-latin-wght-normal-.*\.woff2$/)]
          return [
            ...(hero
              ? [
                  {
                    tag: 'link',
                    attrs: {
                      rel: 'preload',
                      as: 'image',
                      href: base + hero,
                      imagesrcset: `${base + hero640} 640w, ${base + hero} 1120w`,
                      imagesizes: '(min-width: 1280px) 560px, (min-width: 768px) 46vw, 100vw',
                      fetchpriority: 'high',
                    },
                    injectTo: 'head' as const,
                  },
                ]
              : []),
            ...fonts
              .filter(Boolean)
              .map((f) => ({
                tag: 'link',
                attrs: { rel: 'preload', as: 'font', type: 'font/woff2', href: base + f, crossorigin: '' },
                injectTo: 'head' as const,
              })),
          ]
        },
      },
    ],
    resolve: {
      alias: { '@': path.resolve(import.meta.dirname, './src') },
    },
  }
})
