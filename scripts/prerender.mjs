import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createServer } from 'vite'
const base = 'https://mindbridge.leixue.dev'
const resources = JSON.parse(await readFile(new URL('../src/data/resources.json', import.meta.url), 'utf8'))
const template = await readFile('dist/index.html', 'utf8')
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
const escape = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;')
const englishPaths = ['/', '/about', ...resources.map(r => `/resource/${r.id}`)]
const routes = [...englishPaths, ...englishPaths.map(path => path === '/' ? '/es' : `/es${path}`)]

// Every metadata tag is rebuilt per route from src/i18n/meta.ts. The matching
// template tags are stripped first, so a built page can never keep a stale or
// duplicated og/twitter/alternate/JSON-LD tag from index.html.
const MANAGED_HEAD_PATTERNS = [
  /<title>[\s\S]*?<\/title>\s*/,
  /<meta\s+name="description"[\s\S]*?>\s*/,
  /<meta\s+name="theme-color"[^>]*>\s*/,
  /<link\s+rel="canonical"[^>]*>\s*/,
  /<meta\s+property="og:[^"]*"[^>]*>\s*/g,
  /<meta\s+name="twitter:[^"]*"[^>]*>\s*/g,
  /<link\s+rel="alternate"\s+hreflang="[^"]*"[^>]*>\s*/g,
  /<script\s+type="application\/ld\+json">[\s\S]*?<\/script>\s*/,
]

function headMarkup(meta, schema) {
  const alternates = Object.entries({ ...meta.alternates, 'x-default': meta.alternates.en })
  return [
    `<title>${escape(meta.title)}</title>`,
    `<meta name="description" content="${escape(meta.description)}" />`,
    `<link rel="canonical" href="${meta.canonical}" />`,
    `<meta name="theme-color" content="${meta.themeColor}" />`,
    `<meta property="og:type" content="${meta.ogType}" />`,
    `<meta property="og:site_name" content="${escape(meta.siteName)}" />`,
    `<meta property="og:title" content="${escape(meta.title)}" />`,
    `<meta property="og:description" content="${escape(meta.description)}" />`,
    `<meta property="og:url" content="${meta.canonical}" />`,
    `<meta property="og:locale" content="${meta.locale}_US" />`,
    `<meta property="og:locale:alternate" content="${meta.localeAlternate}" />`,
    `<meta property="og:image" content="${meta.image}" />`,
    `<meta property="og:image:type" content="${meta.imageType}" />`,
    `<meta property="og:image:width" content="${meta.imageWidth}" />`,
    `<meta property="og:image:height" content="${meta.imageHeight}" />`,
    `<meta property="og:image:alt" content="${escape(meta.imageAlt)}" />`,
    `<meta name="twitter:card" content="${meta.twitterCard}" />`,
    `<meta name="twitter:title" content="${escape(meta.title)}" />`,
    `<meta name="twitter:description" content="${escape(meta.description)}" />`,
    `<meta name="twitter:image" content="${meta.image}" />`,
    `<meta name="twitter:image:alt" content="${escape(meta.imageAlt)}" />`,
    ...alternates.map(([lang, route]) => `<link rel="alternate" hreflang="${lang}" href="${base}${route}" />`),
    `<script type="application/ld+json">${JSON.stringify(schema).replaceAll('<', '\\u003c')}</script>`,
  ].join('\n    ')
}

try {
  const { render } = await server.ssrLoadModule('/src/entry-server.tsx')
  const { pageMetadata, siteSchema } = await server.ssrLoadModule('/src/i18n/meta.ts')
  for (const path of routes) {
    const meta = pageMetadata(path)
    let html = template
    for (const pattern of MANAGED_HEAD_PATTERNS) html = html.replace(pattern, '')
    html = html
      .replace(/<html lang="[^"]+"/, `<html lang="${meta.locale}"`)
      .replace(/<div id="root">[\s\S]*?<\/div>/, () => `<div id="root">${render(path)}</div>`)
      .replace('</head>', `    ${headMarkup(meta, siteSchema(meta))}\n  </head>`)
      .replace(/(<noscript><p[^>]*>)[\s\S]*?(<\/p><\/noscript>)/, (_all, before, after) => before + (meta.locale === 'es' ? 'Los enlaces de teléfono y de sitios web funcionan sin JavaScript. La búsqueda interactiva requiere JavaScript.' : 'Phone and website links work without JavaScript. Interactive search requires JavaScript.') + after)
    const directory = path === '/' ? 'dist' : `dist${path}`
    await mkdir(directory, { recursive: true })
    await writeFile(`${directory}/index.html`, html)
  }
  await writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${routes.map(path => { const meta = pageMetadata(path); return `<url><loc>${base}${path}</loc>${Object.entries({ ...meta.alternates, 'x-default': meta.alternates.en }).map(([lang, route]) => `<xhtml:link rel="alternate" hreflang="${lang}" href="${base}${route}" />`).join('')}</url>` }).join('')}</urlset>`)
  await writeFile('dist/robots.txt', `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`)
  await writeFile('dist/_redirects', `${routes.filter(path => path !== '/').map(path => `${path} ${path}/index.html 200\n${path}/ ${path}/index.html 200`).join('\n')}\n/es/* /es/index.html 200\n/* /index.html 200\n`)
  console.log(`Prerendered ${routes.length} English/Spanish pages with localized metadata, images, crisis links and readable content.`)
} finally { await server.close() }
