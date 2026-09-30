import type { ReactNode } from "react"
import { GentleSprout, type SproutPose } from "./GentleSprout"

// Static speech-bubble framing. Children keep their real heading semantics.
export function SproutSpeech({ children, pose = "hello", small = false, hero = false }: { children: ReactNode; pose?: SproutPose; small?: boolean; hero?: boolean }) {
  return <div data-sprout-speech className={`flex flex-row items-center gap-3 sm:gap-4 ${hero ? "mx-auto max-w-3xl" : "max-w-2xl"}`}>
    <GentleSprout pose={pose} small={small} />
    <div data-speech-bubble className={`relative min-w-0 rounded-2xl border border-sage-200 bg-cream-50 px-4 py-3 shadow-sm sm:px-5 ${hero ? "w-full flex-1" : ""}`}>
      <span aria-hidden="true" className="absolute -left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 border-b border-l border-sage-200 bg-cream-50" />
      {children}
    </div>
  </div>
}
