import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createServer } from 'vite'
const base = 'https://mindbridge.leixue.dev'
const resources = JSON.parse(await readFile(new URL('../src/data/resources.json', import.meta.url), 'utf8'))
const template = await readFile('dist/index.html', 'utf8')
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
const escape = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;')
const englishPaths = ['/', '/about', ...resources.map(r => `/resource/${r.id}`)]
const routes = [...englishPaths, ...englishPaths.map(path => path === '/' ? '/es' : `/es${path}`)]
try {
  const { render } = await server.ssrLoadModule('/src/entry-server.tsx')
  const { pageMetadata } = await server.ssrLoadModule('/src/i18n/meta.ts')
  for (const path of routes) {
    const meta = pageMetadata(path)
    const alternates = Object.entries({ ...meta.alternates, 'x-default': meta.alternates.en }).map(([lang, route]) => `<link rel="alternate" hreflang="${lang}" href="${base}${route}" />`).join('')
    const schema = { '@context': 'https://schema.org', '@type': 'WebSite', name: 'MindBridge', url: base + (meta.locale === 'es' ? '/es' : '/'), inLanguage: meta.locale, description: meta.description }
    const html = template.replace(/<html lang="[^"]+"/, `<html lang="${meta.locale}"`)
      .replace(/<div id="root">[\s\S]*?<\/div>/, () => `<div id="root">${render(path)}</div>`)
      .replace(/<title>[\s\S]*?<\/title>/, () => `<title>${escape(meta.title)}</title>`)
      .replace(/(<meta\s+name="description"\s+content=")[^"]+/, () => `<meta name="description" content="${escape(meta.description)}`)
      .replace(/(<link rel="canonical" href=")[^"]+/, `$1${meta.canonical}`)
      .replace(/(<meta property="og:url" content=")[^"]+/, `$1${meta.canonical}`)
      .replace(/(<meta property="og:title" content=")[^"]+/, () => `<meta property="og:title" content="${escape(meta.title)}`)
      .replace(/(<meta property="og:description" content=")[^"]+/, () => `<meta property="og:description" content="${escape(meta.description)}`)
      .replace(/(<meta property="og:locale" content=")[^"]+/, `$1${meta.locale}_US`)
      .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, () => `<script type="application/ld+json">${JSON.stringify(schema).replaceAll('<', '\\u003c')}</script>`)
      .replace('</head>', `${alternates}<meta property="og:locale:alternate" content="${meta.locale === 'es' ? 'en' : 'es'}_US" /></head>`)
      .replace(/(<noscript><p[^>]*>)[\s\S]*?(<\/p><\/noscript>)/, (_all, before, after) => before + (meta.locale === 'es' ? 'Los enlaces de teléfono y de sitios web funcionan sin JavaScript. La búsqueda interactiva requiere JavaScript.' : 'Phone and website links work without JavaScript. Interactive search requires JavaScript.') + after)
    const directory = path === '/' ? 'dist' : `dist${path}`
    await mkdir(directory, { recursive: true })
    await writeFile(`${directory}/index.html`, html)
  }
  await writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${routes.map(path => { const meta = pageMetadata(path); return `<url><loc>${base}${path}</loc>${Object.entries({ ...meta.alternates, 'x-default': meta.alternates.en }).map(([lang, route]) => `<xhtml:link rel="alternate" hreflang="${lang}" href="${base}${route}" />`).join('')}</url>` }).join('')}</urlset>`)
  await writeFile('dist/robots.txt', `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`)
  await writeFile('dist/_redirects', `${routes.filter(path => path !== '/').map(path => `${path} ${path}/index.html 200\n${path}/ ${path}/index.html 200`).join('\n')}\n/es/* /es/index.html 200\n/* /index.html 200\n`)
  console.log(`Prerendered ${routes.length} English/Spanish pages with readable content and crisis links.`)
} finally { await server.close() }
