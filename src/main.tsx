import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

// Keep old shared hash-router links working without changing ordinary section anchors.
// Only same-origin paths are accepted: a crafted hash such as #//example.com
// would make replaceState throw before the app mounts.
if (window.location.hash.startsWith('#/')) {
  try {
    const route = new URL(window.location.hash.slice(1), window.location.origin)
    if (route.origin === window.location.origin) window.history.replaceState(null, '', route.pathname + route.search + route.hash)
  } catch {
    // Keep the current URL and still render the app.
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
