import { Route, Routes, Link } from "react-router-dom"
import { CrisisBanner } from "./components/CrisisBanner"
import { Footer } from "./components/Footer"
import { Header } from "./components/Header"
import { AboutPage } from "./pages/AboutPage"
import { HomePage } from "./pages/HomePage"
import { ResourceDetailPage } from "./pages/ResourceDetailPage"
import { btnSecondary } from "./lib/ui"

function NotFoundPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-2xl font-extrabold text-stone-900">Page not found</h1>
      <p className="mt-3 text-stone-700">The page you're looking for doesn't exist.</p>
      <Link to="/" className={`${btnSecondary} mt-6`}>
        Back to home
      </Link>
    </div>
  )
}

export default function App() {
  return (
    <div className="flex min-h-svh flex-col">
      <CrisisBanner />
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/resource/:id" element={<ResourceDetailPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
