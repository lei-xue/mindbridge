import { NavLink } from "react-router-dom"
import { focusRing } from "../lib/ui"

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-2 py-2.5 font-semibold sm:px-3 ${focusRing} ${
    isActive ? "bg-sage-100 text-sage-900" : "text-sage-700 hover:bg-sage-50"
  }`

export function Header() {
  return (
    <header className="border-b border-sage-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3 sm:gap-4">
        <NavLink
          to="/"
          className={`flex items-center gap-2 rounded text-lg font-extrabold text-sage-800 ${focusRing}`}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 32 32"
            className="h-7 w-7 rounded-lg bg-sage-700 p-1"
            fill="none"
          >
            <path
              d="M16 25s-8-4.9-8-10.7A4.6 4.6 0 0 1 16 11a4.6 4.6 0 0 1 8 3.3C24 20.1 16 25 16 25z"
              fill="#faf9f6"
            />
          </svg>
          MindBridge
        </NavLink>
        <nav aria-label="Main" className="flex items-center gap-0 sm:gap-1">
          <NavLink to="/" end className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to="/about" className={navLinkClass}>
            About
          </NavLink>
        </nav>
      </div>
    </header>
  )
}
