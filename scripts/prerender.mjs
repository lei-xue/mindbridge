import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createServer } from 'vite'

const base = 'https://mindbridge.leixue.dev'
const resources = JSON.parse(await readFile(new URL('../src/data/resources.json', import.meta.url), 'utf8'))
const template = (await readFile('dist/index.html', 'utf8')).replaceAll('"./assets/', '"/assets/').replaceAll('"./favicon.svg"', '"/favicon.svg"')
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
const escape = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;')
const routes = [
  { path: '/', title: 'MindBridge — Find Mental Health Help, Fast' },
  { path: '/about', title: 'About MindBridge — Sources, Privacy & Safety' },
  ...resources.map(r => ({ path: `/resource/${r.id}`, title: `${r.name} — MindBridge` })),
]
try {
  const { render } = await server.ssrLoadModule('/src/entry-server.tsx')
  for (const { path, title } of routes) {
    const html = template.replace(/<div id="root">[\s\S]*?<\/div>/, () => `<div id="root">${render(path)}</div>`)
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${escape(title)}</title>`)
      .replace(/(<link rel="canonical" href=")[^"]+/, `$1${base}${path}`)
      .replace(/(<meta property="og:url" content=")[^"]+/, `$1${base}${path}`)
      .replace(/(<meta property="og:title" content=")[^"]+/, `$1${escape(title)}`)
    const directory = path === '/' ? 'dist' : `dist${path}`
    await mkdir(directory, { recursive: true })
    await writeFile(`${directory}/index.html`, html)
  }
  await writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(({path}) => `<url><loc>${base}${path}</loc></url>`).join('')}</urlset>`)
  await writeFile('dist/robots.txt', `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`)
  await writeFile('dist/_redirects', `${routes.filter(r => r.path !== '/').map(({path}) => `${path} ${path}/index.html 200\n${path}/ ${path}/index.html 200`).join('\n')}\n/* /index.html 200\n`)
  console.log(`Prerendered ${routes.length} pages with readable content and crisis links; no runtime server required.`)
} finally {
  await server.close()
}
