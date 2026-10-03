// A quiet decorative family, never an assistant or a clinical promise.
export type SproutPose = "hello" | "wave" | "hug" | "read" | "bloom"
export function GentleSprout({ small = false, pose = "hello", className = "" }: { small?: boolean; pose?: SproutPose; className?: string }) {
  const pot = pose === "read" ? "#e4eaf1" : pose === "bloom" ? "#f1e2e8" : "#f4e5d7"
  return (
    <svg aria-hidden="true" focusable="false" data-sprout={pose} viewBox="0 0 96 112" className={`${small ? "h-[56px] w-[48px]" : "h-[96px] w-[80px]"} shrink-0 ${className}`}>
      <ellipse cx="48" cy="103" rx="28" ry="5" fill="#e6ede6" />
      <path d="M48 65V37" fill="none" stroke="#506a56" strokeWidth="4" strokeLinecap="round" />
      <path d="M47 49C27 50 18 39 21 24C38 23 49 31 47 49Z" fill="#a9bfab" stroke="#506a56" strokeWidth="2" />
      <path d="M49 39C48 22 61 13 77 17C77 32 66 43 49 39Z" fill="#ccd9cd" stroke="#506a56" strokeWidth="2" />
      <path d="M33 36L46 47M63 27L50 38" stroke="#506a56" strokeWidth="2" strokeLinecap="round" />
      {pose === "bloom" && <g fill="#edc8d4" stroke="#95677a" strokeWidth="1.5"><circle cx="48" cy="17" r="7"/><circle cx="39" cy="24" r="7"/><circle cx="57" cy="24" r="7"/><circle cx="43" cy="33" r="7"/><circle cx="53" cy="33" r="7"/><circle cx="48" cy="25" r="5" fill="#f5dfa0"/></g>}
      <path d="M24 65H72L66 94Q48 104 30 94Z" fill={pot} stroke="#92664b" strokeWidth="2" strokeLinejoin="round" />
      <rect x="21" y="60" width="54" height="11" rx="5" fill={pot} stroke="#92664b" strokeWidth="2" />
      <circle cx="39" cy="81" r="2" fill="#684c3b" /><circle cx="57" cy="81" r="2" fill="#684c3b" />
      <path d="M44 86Q48 90 52 86" fill="none" stroke="#684c3b" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="34" cy="86" rx="3" ry="2" fill="#e8b5a4" /><ellipse cx="62" cy="86" rx="3" ry="2" fill="#e8b5a4" />
      {pose === "wave" && <g fill="none" stroke="#92664b" strokeWidth="2" strokeLinecap="round"><path d="M72 78Q86 76 83 59M83 59L78 56M83 59L86 53"/><path d="M87 44L89 40M76 46L74 42" stroke="#66846c"/></g>}
      {pose === "hug" && <><path d="M48 98L36 88C27 79 39 73 48 82C57 73 69 79 60 88Z" fill="#e8b5a4" stroke="#92664b" strokeWidth="1.5"/><path d="M25 80Q28 92 39 90M71 80Q68 92 57 90" fill="none" stroke="#92664b" strokeWidth="2" strokeLinecap="round"/></>}
      {pose === "read" && <><path d="M25 88Q37 83 48 89Q59 83 71 88V101Q59 96 48 103Q37 96 25 101Z" fill="#faf9f6" stroke="#506a56" strokeWidth="2"/><path d="M48 89V102M31 92L41 93M55 93L65 92" fill="none" stroke="#a9bfab" strokeWidth="2"/></>}
    </svg>
  )
}
