// Metadata contract for the prerendered (built) site.
//
// These assertions run against the real prerender output in dist/, so run the
// build first: `npm run build && npm test`. Without dist/ the suite reports a
// loud skip instead of failing on a fresh checkout.
import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const resources = JSON.parse(readFileSync(new URL('../src/data/resources.json', import.meta.url), 'utf8'))
const spanish = JSON.parse(readFileSync(new URL('../src/data/resources-es.json', import.meta.url), 'utf8'))
const origin = 'https://mindbridge.leixue.dev'
const WIDTH = 1200
const HEIGHT = 630

const englishPaths = ['/', '/about', ...resources.map(r => `/resource/${r.id}`)]
const routes = [...englishPaths, ...englishPaths.map(p => p === '/' ? '/es' : `/es${p}`)]

const distFile = (route) => fileURLToPath(new URL(`../dist${route === '/' ? '' : route}/index.html`, import.meta.url))
const publicSocial = (locale) => new URL(`../public/social/mindbridge-${locale}-${WIDTH}x${HEIGHT}.png`, import.meta.url)

const built = routes.every(route => existsSync(distFile(route)))
const skip = built ? false : 'run `npm run build` first: dist/ prerendered routes are missing'

const escapeHtml = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;')
const localeOf = (route) => route === '/es' || route.startsWith('/es/') ? 'es' : 'en'
const routeOf = (route) => route === '/es' ? '/' : route.startsWith('/es/') ? route.slice(3) : route
const count = (html, pattern) => (html.match(pattern) || []).length

// PNG IHDR: width/height are 32-bit big-endian integers at byte offsets 16 and 20.
function pngSize(url) {
  const buffer = readFileSync(url)
  assert.equal(buffer.subarray(1, 4).toString('latin1'), 'PNG', `${url.pathname} is not a PNG`)
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20), bytes: buffer.length }
}

// Each managed key must appear exactly once in a built page.
const managedSelectors = [
  ['description', /<meta\s+name="description"/g],
  ['theme-color', /<meta\s+name="theme-color"/g],
  ['canonical', /<link\s+rel="canonical"/g],
  ['og:type', /<meta\s+property="og:type"/g],
  ['og:site_name', /<meta\s+property="og:site_name"/g],
  ['og:title', /<meta\s+property="og:title"/g],
  ['og:description', /<meta\s+property="og:description"/g],
  ['og:url', /<meta\s+property="og:url"/g],
  ['og:locale', /<meta\s+property="og:locale"/g],
  ['og:locale:alternate', /<meta\s+property="og:locale:alternate"/g],
  ['og:image', /<meta\s+property="og:image"/g],
  ['og:image:type', /<meta\s+property="og:image:type"/g],
  ['og:image:width', /<meta\s+property="og:image:width"/g],
  ['og:image:height', /<meta\s+property="og:image:height"/g],
  ['og:image:alt', /<meta\s+property="og:image:alt"/g],
  ['twitter:card', /<meta\s+name="twitter:card"/g],
  ['twitter:title', /<meta\s+name="twitter:title"/g],
  ['twitter:description', /<meta\s+name="twitter:description"/g],
  ['twitter:image', /<meta\s+name="twitter:image"/g],
  ['twitter:image:alt', /<meta\s+name="twitter:image:alt"/g],
  ['hreflang=en', /<link\s+rel="alternate"\s+hreflang="en"/g],
  ['hreflang=es', /<link\s+rel="alternate"\s+hreflang="es"/g],
  ['hreflang=x-default', /<link\s+rel="alternate"\s+hreflang="x-default"/g],
  ['ld+json', /<script\s+type="application\/ld\+json">/g],
  ['title', /<title>/g],
]

test('social sharing cards are real 1200x630 project PNGs', () => {
  for (const locale of ['en', 'es']) {
    const size = pngSize(publicSocial(locale))
    assert.equal(size.width, WIDTH, `${locale} card width`)
    assert.equal(size.height, HEIGHT, `${locale} card height`)
    assert.ok(size.bytes > 10_000, `${locale} card looks empty (${size.bytes} bytes)`)
    if (existsSync(new URL('../dist/index.html', import.meta.url))) {
      const copied = fileURLToPath(new URL(`../dist/social/mindbridge-${locale}-${WIDTH}x${HEIGHT}.png`, import.meta.url))
      assert.ok(existsSync(copied), `${locale} card was not copied into dist/`)
    }
  }
})

for (const route of routes) {
  test(`built metadata for ${route} is complete, localized and duplicate-free`, { skip }, () => {
    const html = readFileSync(distFile(route), 'utf8')
    const locale = localeOf(route)
    const pageRoute = routeOf(route)
    const resource = resources.find(r => pageRoute === `/resource/${r.id}`)
    const description = resource ? (locale === 'es' ? spanish[resource.id].description : resource.description) : null

    // Exactly one of every managed tag, and no leftover template tags.
    for (const [name, pattern] of managedSelectors) {
      assert.equal(count(html, pattern), 1, `${route}: expected exactly one ${name} tag`)
    }

    assert.match(html, new RegExp(`<html lang="${locale}"`), `${route}: html lang`)

    const canonical = `${origin}${route}`
    assert.ok(html.includes(`<link rel="canonical" href="${canonical}" />`), `${route}: canonical`)
    assert.ok(html.includes(`<meta property="og:url" content="${canonical}" />`), `${route}: og:url`)
    assert.ok(html.includes(`<meta property="og:locale" content="${locale}_US" />`), `${route}: og:locale`)
    assert.ok(html.includes(`<meta property="og:locale:alternate" content="${locale === 'es' ? 'en' : 'es'}_US" />`), `${route}: og:locale:alternate`)

    const enPath = route === '/es' ? '/' : route.startsWith('/es/') ? route.slice(3) : route
    const esPath = enPath === '/' ? '/es' : `/es${enPath}`
    assert.ok(html.includes(`<link rel="alternate" hreflang="en" href="${origin}${enPath}" />`), `${route}: hreflang en`)
    assert.ok(html.includes(`<link rel="alternate" hreflang="es" href="${origin}${esPath}" />`), `${route}: hreflang es`)
    assert.ok(html.includes(`<link rel="alternate" hreflang="x-default" href="${origin}${enPath}" />`), `${route}: hreflang x-default`)

    // og and Twitter title/description agree; the card is the localized 1200x630 PNG.
    const title = html.match(/<meta property="og:title" content="([^"]*)"/)[1]
    const ogDescription = html.match(/<meta property="og:description" content="([^"]*)"/)[1]
    const image = `${origin}/social/mindbridge-${locale}-${WIDTH}x${HEIGHT}.png`
    assert.equal(html.match(/<meta name="twitter:title" content="([^"]*)"/)[1], title, `${route}: twitter:title`)
    assert.equal(html.match(/<meta name="twitter:description" content="([^"]*)"/)[1], ogDescription, `${route}: twitter:description`)
    assert.ok(html.includes(`<title>${title}</title>`), `${route}: title tag matches og:title`)
    assert.ok(html.includes(`<meta name="twitter:image" content="${image}" />`), `${route}: twitter:image`)
    assert.ok(html.includes(`<meta property="og:image" content="${image}" />`), `${route}: og:image`)
    assert.ok(html.includes(`<meta property="og:image:type" content="image/png" />`), `${route}: og:image:type`)
    assert.ok(html.includes(`<meta property="og:image:width" content="${WIDTH}" />`), `${route}: og:image:width`)
    assert.ok(html.includes(`<meta property="og:image:height" content="${HEIGHT}" />`), `${route}: og:image:height`)
    assert.ok(html.includes(`<meta name="theme-color" content="#506a56" />`), `${route}: theme-color`)
    assert.ok(html.includes('<meta property="og:site_name" content="MindBridge" />'), `${route}: og:site_name`)
    assert.ok(html.includes('<meta property="og:type" content="website" />'), `${route}: og:type`)
    assert.ok(html.includes('<meta name="twitter:card" content="summary_large_image" />'), `${route}: twitter:card`)
    assert.ok(pngSize(publicSocial(locale)).width === WIDTH, `${route}: image file exists at 1200px wide`)

    // Localized, human alt text — not a duplicated headline.
    const alt = html.match(/<meta property="og:image:alt" content="([^"]*)"/)[1]
    assert.ok(alt.length > 40, `${route}: og:image:alt is descriptive`)
    assert.match(alt, locale === 'es' ? /directorio/ : /directory/, `${route}: alt is localized`)

    // Localized description; resource pages use the resource's own description.
    const escapedDescription = escapeHtml(description ?? '')
    const descriptionContent = html.match(/<meta name="description" content="([^"]*)"/)[1]
    if (resource) {
      assert.equal(descriptionContent, escapedDescription, `${route}: localized resource description`)
    } else {
      assert.match(descriptionContent, locale === 'es' ? /no (es )?un proveedor médico/i : /not a medical provider/i, `${route}: directory is not a medical provider`)
      assert.match(descriptionContent, locale === 'es' ? /líneas de crisis/i : /crisis lines/i, `${route}: names crisis lines`)
      if (pageRoute === '/') assert.match(descriptionContent, /988/, `${route}: attributes free/confidential help to the crisis line`)
    }
    assert.equal(ogDescription, descriptionContent, `${route}: og:description matches description`)

    // JSON-LD: valid, safe to inline, minimal and truthful.
    const schemaRaw = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]
    assert.ok(!schemaRaw.includes('<'), `${route}: JSON-LD cannot break out of its script tag`)
    const schema = JSON.parse(schemaRaw)
    assert.equal(schema['@context'], 'https://schema.org')
    assert.equal(schema['@type'], 'WebSite')
    assert.equal(schema.name, 'MindBridge')
    assert.equal(schema.inLanguage, locale)
    assert.equal(schema.url, `${origin}${locale === 'es' ? '/es' : '/'}`)

    // The directory and privacy posture are untouched.
    assert.ok(html.includes('href="/favicon.svg"'), `${route}: favicon preserved`)
    assert.ok(html.includes('<meta name="referrer" content="no-referrer" />'), `${route}: referrer policy preserved`)
    assert.ok(html.includes('href="tel:988"') && html.includes('href="sms:988"'), `${route}: crisis links preserved`)
  })
}
