import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Bewusst hier dupliziert: Node lädt diese Config als ESM, während
// src/shared/brand.ts zum Renderer-Bundle gehört.
const NAME = 'Funkkunst'
const URL = 'https://funkkunst.de'
const DESCRIPTION =
  'Funkkunst ist ein kostenloses Webradio: handverlesene Sender und über 50.000 Livestreams. Ohne Werbung, ohne Konto, ohne Tracking.'

/**
 * Der Web-Build nutzt denselben Renderer wie die Electron-App, ersetzt aber
 * die Electron-CSP durch eine strikte Website-CSP (nur https, keine Inline-
 * Skripte) und ergänzt Social-/SEO-Metadaten.
 */
const WEB_CSP = [
  "default-src 'self'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' https: blob:",
  "connect-src 'self' https:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self'",
  "worker-src 'self' blob:",
  "font-src 'self' data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'"
].join('; ')

function webHead(): Plugin {
  return {
    name: 'funkkunst-web-head',
    transformIndexHtml(html) {
      return html
        .replace(
          /<meta\s+http-equiv="Content-Security-Policy"[\s\S]*?\/>/,
          `<meta http-equiv="Content-Security-Policy" content="${WEB_CSP}" />`
        )
        .replace(
          '</title>',
          `</title>
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${NAME}" />
    <meta property="og:title" content="${NAME} — Webradio" />
    <meta property="og:description" content="${DESCRIPTION}" />
    <meta property="og:url" content="${URL}/" />
    <meta property="og:image" content="${URL}/og.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="canonical" href="${URL}/" />`
        )
    }
  }
}

export default defineConfig({
  root: resolve(import.meta.dirname, 'src/renderer'),
  base: './',
  resolve: {
    alias: {
      '@renderer': resolve(import.meta.dirname, 'src/renderer/src'),
      '@shared': resolve(import.meta.dirname, 'src/shared')
    }
  },
  plugins: [react(), tailwindcss(), webHead()],
  build: {
    outDir: resolve(import.meta.dirname, 'dist-web'),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(import.meta.dirname, 'src/renderer/index.html')
    }
  },
  server: {
    port: 4173
  },
  preview: {
    port: 4173
  }
})
