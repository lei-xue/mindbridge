import type { ReactNode } from "react"
import { GentleSprout, type SproutPose } from "./GentleSprout"

// Static speech-bubble framing. Children keep their real heading semantics.
export function SproutSpeech({ children, pose = "hello", small = false, hero = false }: { children: ReactNode; pose?: SproutPose; small?: boolean; hero?: boolean }) {
  return <div data-sprout-speech className={`flex items-center gap-3 sm:gap-4 ${hero ? "mx-auto max-w-3xl flex-col sm:flex-row" : "max-w-2xl"}`}>
    <GentleSprout pose={pose} small={hero || small} className={hero ? "sm:h-24 sm:w-20" : ""} />
    <div data-speech-bubble className={`relative min-w-0 rounded-2xl border border-sage-200 bg-cream-50 px-4 py-3 shadow-sm sm:px-5 ${hero ? "w-full flex-1" : ""}`}>
      <span aria-hidden="true" className={`absolute h-3 w-3 rotate-45 bg-cream-50 ${hero ? "-top-1.5 left-1/2 -translate-x-1/2 border-l border-t sm:-left-1.5 sm:top-1/2 sm:translate-x-0 sm:-translate-y-1/2 sm:border-b sm:border-t-0" : "-left-1.5 top-1/2 -translate-y-1/2 border-b border-l"} border-sage-200`} />
      {children}
    </div>
  </div>
}
