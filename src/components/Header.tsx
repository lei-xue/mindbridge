import { NavLink, Link, useLocation } from "react-router-dom"
import { focusRing } from "../lib/ui"
import { useLocale } from "../i18n/LocaleProvider"
import { safeSearch, switchLocalePath } from "../lib/localePath"

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex min-h-11 items-center rounded-md px-1 font-semibold sm:px-3 ${focusRing} ${
    isActive ? "bg-sage-100 text-sage-900" : "text-sage-700 hover:bg-sage-50"
  }`

export function Header() {
  const { locale, s, to } = useLocale()
  const { pathname, search, hash } = useLocation()
  return (
    <header className="border-b border-sage-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3 sm:gap-4">
        <NavLink
          to={to("/")}
          className={`flex min-h-11 min-w-0 max-w-full items-center gap-2 rounded text-lg font-extrabold text-sage-800 ${focusRing}`}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 32 32"
            className="h-[28px] w-[28px] shrink-0 rounded-lg bg-sage-700 p-1"
            fill="none"
          >
            <path
              d="M16 25s-8-4.9-8-10.7A4.6 4.6 0 0 1 16 11a4.6 4.6 0 0 1 8 3.3C24 20.1 16 25 16 25z"
              fill="#faf9f6"
            />
          </svg>
          <span className="min-w-0">Mind<wbr />Bridge</span>
        </NavLink>
        <nav aria-label={s.nav.aria} className="flex flex-wrap items-center gap-0 text-sm sm:gap-1 sm:text-base">
          <NavLink to={to("/")} end className={navLinkClass}>
            {s.nav.home}
          </NavLink>
          <NavLink to={to("/about")} className={navLinkClass}>
            {s.nav.about}
          </NavLink>
          <Link to={switchLocalePath(locale, pathname) + safeSearch(search) + hash} aria-label={s.nav.switchAria} lang={locale === "en" ? "es" : "en"} className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-1 font-semibold text-teal-800 underline sm:px-3 ${focusRing}`}>
            <span className="sm:hidden">{s.nav.switchShort}</span><span className="hidden sm:inline">{s.nav.switchLabel}</span>
          </Link>
        </nav>
      </div>
    </header>
  )
}
