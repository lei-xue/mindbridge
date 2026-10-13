import { useEffect, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { focusRing } from "../lib/ui"

import { useLocale } from "../i18n/LocaleProvider"

const START_YEAR = 2026
const currentYear = new Date().getFullYear()
const copyrightYears = currentYear > START_YEAR ? `${START_YEAR}–${currentYear}` : `${START_YEAR}`

export function Footer() {
  const { s, to } = useLocale()
  const { pathname } = useLocation()
  const isHome = pathname === '/' || pathname === '/es' || pathname === '/es/'
  // The contact address is rendered only after hydration: Cloudflare obfuscates
  // mailto links in served HTML, which otherwise causes a React hydration (#418).
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return <footer className="bg-sage-800 text-sage-100">
    <div className="mx-auto max-w-5xl space-y-2 px-4 py-8 text-sm">

      {!isHome && <p>{s.footer.inCrisis}{" "}<a href="tel:988" className={`rounded font-bold text-white underline underline-offset-2 hover:text-sage-200 ${focusRing}`}>{s.footer.call}</a>{" "}{s.footer.crisisScope}</p>}

      <p>{s.footer.disclaimer}</p>
      <p className="text-xs text-sage-200">© {copyrightYears} MindBridge · {s.footer.version(__APP_BUILD_VERSION__)}</p>
      {!isHome && <p><Link to={to("/about")} className={`rounded font-semibold text-white underline underline-offset-2 hover:text-sage-200 ${focusRing}`}>{s.footer.about}</Link></p>}
      {mounted && <p>{s.footer.contact}{" "}<a href="mailto:hi@leixue.dev" className={`rounded font-semibold text-white underline underline-offset-2 hover:text-sage-200 ${focusRing}`}>hi@leixue.dev</a></p>}
    </div>
  </footer>
}
