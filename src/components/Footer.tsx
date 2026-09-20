import { Link } from "react-router-dom"
import { DATA_LAST_REVIEWED } from "../data/meta"
import { focusRing } from "../lib/ui"

export function Footer() {
  return (
    <footer className="bg-sage-800 text-sage-100">
      <div className="mx-auto max-w-5xl space-y-2 px-4 py-8 text-sm">
        <p className="font-extrabold text-white">MindBridge — Find mental health help, fast.</p>
        <p>
          In crisis?{" "}
          <a
            href="tel:988"
            className={`rounded font-bold text-white underline underline-offset-2 hover:text-sage-200 ${focusRing}`}
          >
            Call or text 988
          </a>{" "}
          (Suicide &amp; Crisis Lifeline, 24/7, free).
        </p>
        <p>
          Data last reviewed {DATA_LAST_REVIEWED}. Information may change — always confirm on the
          provider's official site.
        </p>
        <p>
          MindBridge is an information directory, not a substitute for professional care. In an
          emergency, call 911.
        </p>
        <p>
          <Link
            to="/about"
            className={`rounded font-semibold text-white underline underline-offset-2 hover:text-sage-200 ${focusRing}`}
          >
            About MindBridge
          </Link>
        </p>
      </div>
    </footer>
  )
}
