import { Link, useLocation } from "react-router-dom"
import { focusRing } from "../lib/ui"

import { useLocale } from "../i18n/LocaleProvider"
export function Footer() {
  const { s, to } = useLocale()
  const { pathname } = useLocation()
  const isHome = pathname === '/' || pathname === '/es' || pathname === '/es/'
  return <footer className="bg-sage-800 text-sage-100">
    <div className="mx-auto max-w-5xl space-y-2 px-4 py-8 text-sm">

      {!isHome && <p>{s.footer.inCrisis}{" "}<a href="tel:988" className={`rounded font-bold text-white underline underline-offset-2 hover:text-sage-200 ${focusRing}`}>{s.footer.call}</a>{" "}{s.footer.crisisScope}</p>}

      <p>{s.footer.disclaimer}</p>
      <p className="text-xs text-sage-200">{s.footer.version(__APP_BUILD_VERSION__)}</p>
      {!isHome && <p><Link to={to("/about")} className={`rounded font-semibold text-white underline underline-offset-2 hover:text-sage-200 ${focusRing}`}>{s.footer.about}</Link></p>}
    </div>
  </footer>
}
