import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

// Static documents work without JS; enhance direct static routes with our existing hash router.
if (!window.location.hash.startsWith('#/') && /^\/(about|resource\/[^/]+)\/?$/.test(window.location.pathname)) {
  const route = window.location.pathname.replace(/\/$/, '')
  window.history.replaceState(null, '', `/#${route}`)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
