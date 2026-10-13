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
  const { pageMetadata, siteSchema, authorPerson } = await server.ssrLoadModule('/src/i18n/meta.ts')
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
  const lastmod = new Date().toISOString().slice(0, 10)
  const altLinks = meta => Object.entries({ ...meta.alternates, 'x-default': meta.alternates.en }).map(([lang, route]) => `<xhtml:link rel="alternate" hreflang="${lang}" href="${base}${route}" />`).join('')
  await writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${routes.map(path => { const meta = pageMetadata(path); return `<url><loc>${base}${path}</loc><lastmod>${lastmod}</lastmod>${altLinks(meta)}</url>` }).join('')}</urlset>`)

  // robots.txt is a real static file. Every listed crawler gets an explicit
  // group; private app paths stay disallowed for each group so a more specific
  // AI group can never reopen them.
  const aiBots = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended', 'CCBot']
  const privatePaths = ['/api']
  const robotsGroups = ['*', ...aiBots]
  await writeFile('dist/robots.txt', [
    ...robotsGroups.flatMap((agent, index) => [
      `User-agent: ${agent}`,
      'Allow: /',
      ...privatePaths.map(path => `Disallow: ${path}`),
      ...(index < robotsGroups.length - 1 ? [''] : []),
    ]),
    '',
    `Sitemap: ${base}/sitemap.xml`,
    '',
  ].join('\n'))

  // llms.txt / llms-full.txt (llmstxt.org): plain-text pointers for AI
  // crawlers that do not run JavaScript. Copy comes from the same data as the
  // site; no numbers, ratings or features are invented.
  const summary = 'A free, independent English/Spanish directory of US mental-health crisis lines and support resources, including 988, the Crisis Text Line and county services.'
  const paragraph = `MindBridge is a free, independent directory of U.S. mental-health crisis lines and support resources, in English and Spanish. It lists national lines such as 988 (call or text), the Crisis Text Line and the Trevor Project, plus California in-person options searchable by county or ZIP, including official county mental-health plan contacts. It is for anyone in the United States looking for immediate crisis support or ongoing mental-health resources. Built with React, TypeScript, Vite, Tailwind CSS and Cloudflare Workers. An independent project by ${authorPerson.name} (${authorPerson.url}, ${authorPerson.sameAs[0]}). Contact: hi@leixue.dev. MindBridge is an information directory, not a medical provider; if you or someone else is in immediate danger, call 911.`
  const keyPages = [
    `- [MindBridge (English)](${base}/): ${pageMetadata('/').description}`,
    `- [MindBridge (Español)](${base}/es): ${pageMetadata('/es').description}`,
    `- [About MindBridge](${base}/about): ${pageMetadata('/about').description}`,
    ...resources.map(r => `- [${r.name}](${base}/resource/${r.id}): ${r.description}`),
  ]
  await writeFile('dist/llms.txt', [`# MindBridge`, '', `> ${summary}`, '', paragraph, '', '## Key pages', '', ...keyPages, ''].join('\n'))
  const resourceDetails = resources.map(r => {
    const lines = [`### ${r.name}`, `- Page: ${base}/resource/${r.id}`, `- Category: ${r.category}`, `- Region: ${r.region}`]
    if (r.phone) lines.push(`- Phone: ${r.phone}`)
    if (r.text) lines.push(`- Text: ${r.text}`)
    lines.push(`- Hours: ${r.hours}`)
    if (r.audience?.length) lines.push(`- Audience: ${r.audience.join(', ')}`)
    if (r.issues?.length) lines.push(`- Issues: ${r.issues.join(', ')}`)
    if (r.website) lines.push(`- Website: ${r.website}`)
    lines.push(`- Description: ${r.description}`)
    return lines.join('\n')
  })
  await writeFile('dist/llms-full.txt', [
    '# MindBridge', '', `> ${summary}`, '', paragraph, '',
    '## Key pages', '', ...keyPages, '',
    '## Directory resources', '', ...resourceDetails.flatMap(detail => [detail, '']),
    '## Sources', '',
    "- Data is compiled from public information from SAMHSA, the 988 Suicide & Crisis Lifeline and each provider's official website.",
    '- California data comes from CDPH, DHCS, HCAI and county snapshots; the directory was last reviewed in September 2026.',
    '- A source-check date means contact information was matched to an official web page, not that a test call was made or availability is guaranteed.',
    '',
  ].join('\n'))

  await writeFile('dist/_redirects', `${routes.filter(path => path !== '/').map(path => `${path} ${path}/index.html 200\n${path}/ ${path}/index.html 200`).join('\n')}\n/es/* /es/index.html 200\n/* /index.html 200\n`)
  console.log(`Prerendered ${routes.length} English/Spanish pages with localized metadata, images, crisis links and readable content, plus sitemap.xml, robots.txt and llms.txt.`)
} finally { await server.close() }
