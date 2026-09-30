import { createContext, useContext, type ReactNode } from "react"
import { useLocation } from "react-router-dom"
import { localeFromPath, localizePath, type Locale } from "../lib/localePath"
import { strings } from "./strings"
import { translate } from "./translate"

const LocaleContext = createContext<Locale>("en")
export function LocaleProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  return <LocaleContext.Provider value={localeFromPath(pathname)}>{children}</LocaleContext.Provider>
}
export function useLocale() { // oxlint-disable-line react/only-export-components
  const locale = useContext(LocaleContext)
  return { locale, s: strings[locale], to: (path: string) => localizePath(locale, path), t: (text: string) => translate(locale, text) }
}
