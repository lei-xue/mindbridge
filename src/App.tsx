import { useEffect } from "react"
import { Route, Routes, Link } from "react-router-dom"
import { CrisisBanner } from "./components/CrisisBanner"
import { Footer } from "./components/Footer"
import { Header } from "./components/Header"
import { AboutPage } from "./pages/AboutPage"
import { HomePage } from "./pages/HomePage"
import { ResourceDetailPage } from "./pages/ResourceDetailPage"
import { btnSecondary, focusRing } from "./lib/ui"
import { LocaleProvider, useLocale } from "./i18n/LocaleProvider"
import { DocumentMeta } from "./i18n/DocumentMeta"

function NotFoundPage() {
  const { s, to } = useLocale()
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-2xl font-extrabold text-stone-900">{s.notFound.heading}</h1>
      <p className="mt-3 text-stone-700">{s.notFound.body}</p>
      <Link to={to("/")} className={`${btnSecondary} mt-6`}>
        {s.notFound.back}
      </Link>
    </div>
  )
}

function AppContent() {
  const { s } = useLocale()
  useEffect(() => { document.documentElement.setAttribute("data-enhanced", "true") }, [])
  return (
    <div className="flex min-h-svh flex-col">
      <DocumentMeta />
      <a
        href="#main-content"
        onClick={(event) => {
          event.preventDefault()
          const main = document.getElementById("main-content")
          main?.focus()
          main?.scrollIntoView({
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
            block: "start",
          })
        }}
        className={`sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-2 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:font-semibold focus:text-teal-800 focus:shadow-lg ${focusRing}`}
      >
        {s.common.skipToMain}
      </a>
      <CrisisBanner />
      <Header />
      <main id="main-content" tabIndex={-1} className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/resource/:id" element={<ResourceDetailPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/es" element={<HomePage />} />
          <Route path="/es/resource/:id" element={<ResourceDetailPage />} />
          <Route path="/es/about" element={<AboutPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
export default function App() {
  return <LocaleProvider><AppContent /></LocaleProvider>
}
