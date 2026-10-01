// Builds the original 1200x630 social sharing cards from project brand markup.
// No third-party art or fonts are fetched; the mark is the same sprout/heart
// used by public/favicon.svg. Run: node scripts/build-social-images.mjs
import { mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'

const require = createRequire(new URL('../package.json', import.meta.url))
const { chromium } = require('playwright')

const WIDTH = 1200
const HEIGHT = 630
const OUT_DIR = new URL('../public/social/', import.meta.url)

const mark = (fill, bg) => `<svg viewBox="0 0 32 32" width="86" height="86" role="img" aria-label="MindBridge"><rect width="32" height="32" rx="8" fill="${bg}"/><path d="M16 24s-7.5-4.6-7.5-10a4.3 4.3 0 0 1 7.5-2.9A4.3 4.3 0 0 1 23.5 14c0 5.4-7.5 10-7.5 10z" fill="${fill}"/></svg>`

const copy = {
  en: {
    htmlLang: 'en',
    headline: 'Find mental health help, fast.',
    sub: 'A free directory of US mental health crisis lines and support resources.',
    crisis: 'Call or text 988',
    crisisNote: '24/7 — free and confidential support on crisis lines like 988',
    foot: 'mindbridge.leixue.dev — a directory, not a medical provider',
  },
  es: {
    htmlLang: 'es',
    headline: 'Encuentra ayuda de salud mental, rápido.',
    sub: 'Un directorio gratuito de líneas de crisis y recursos de apoyo en EE. UU.',
    crisis: 'Llama o envía un mensaje al 988',
    crisisNote: '24/7 — apoyo gratuito y confidencial en líneas de crisis como el 988',
    foot: 'mindbridge.leixue.dev — un directorio, no un proveedor médico',
  },
}

const pageHtml = (c, localeLabel) => `<!doctype html>
<html lang="${c.htmlLang}">
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; margin: 0; }
  html, body { width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden; }
  body {
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    background: #faf9f6;
    color: #292524;
  }
  .card { position: relative; width: ${WIDTH}px; height: ${HEIGHT}px; padding: 58px 76px 54px; display: flex; flex-direction: column; }
  .band { position: absolute; inset: 0 0 auto 0; height: 14px; background: #506a56; }
  .brand { display: flex; align-items: center; gap: 18px; }
  .brand-name { font-size: 40px; font-weight: 800; letter-spacing: -0.5px; color: #134e4a; }
  .locale { margin-left: auto; font-size: 22px; font-weight: 700; color: #506a56; border: 2px solid #506a56; border-radius: 999px; padding: 6px 20px; }
  h1 { margin-top: 40px; font-size: 62px; line-height: 1.08; font-weight: 800; letter-spacing: -1.5px; max-width: 1000px; }
  .sub { margin-top: 22px; font-size: 29px; line-height: 1.35; color: #44403c; max-width: 1010px; }
  .crisis { margin-top: auto; display: flex; align-items: baseline; gap: 20px; background: #fef3c7; border-radius: 18px; padding: 22px 30px; }
  .crisis b { font-size: 40px; font-weight: 800; color: #134e4a; white-space: nowrap; }
  .crisis span { font-size: 22px; color: #451a03; }
  .foot { margin-top: 22px; font-size: 21px; color: #57534e; }
</style>
</head>
<body>
  <div class="card">
    <div class="band"></div>
    <div class="brand">${mark('#faf9f6', '#506a56')}<span class="brand-name">MindBridge</span><span class="locale">${localeLabel}</span></div>
    <h1>${c.headline}</h1>
    <p class="sub">${c.sub}</p>
    <div class="crisis"><b>${c.crisis}</b><span>${c.crisisNote}</span></div>
    <p class="foot">${c.foot}</p>
  </div>
</body>
</html>`

await mkdir(OUT_DIR, { recursive: true })
const browser = await chromium.launch()
try {
  for (const [locale, label] of [['en', 'English'], ['es', 'Español']]) {
    const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 })
    await page.setContent(pageHtml(copy[locale], label), { waitUntil: 'load' })
    await page.evaluate(() => document.fonts.ready)
    await page.screenshot({ path: new URL(`mindbridge-${locale}-${WIDTH}x${HEIGHT}.png`, OUT_DIR).pathname, type: 'png' })
    await page.close()
    console.log(`Wrote public/social/mindbridge-${locale}-${WIDTH}x${HEIGHT}.png`)
  }
} finally { await browser.close() }
