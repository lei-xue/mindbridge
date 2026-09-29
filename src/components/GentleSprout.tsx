// Decorative only: not an assistant, chat control, or clinical reassurance.
export function GentleSprout({ small = false }: { small?: boolean }) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 96 112" className={`${small ? "h-14 w-12" : "h-24 w-20"} shrink-0`}>
      <ellipse cx="48" cy="103" rx="28" ry="5" fill="#e6ede6" />
      <path d="M48 65V37" fill="none" stroke="#506a56" strokeWidth="4" strokeLinecap="round" />
      <path d="M47 49C27 50 18 39 21 24C38 23 49 31 47 49Z" fill="#a9bfab" stroke="#506a56" strokeWidth="2" />
      <path d="M49 39C48 22 61 13 77 17C77 32 66 43 49 39Z" fill="#ccd9cd" stroke="#506a56" strokeWidth="2" />
      <path d="M33 36L46 47M63 27L50 38" stroke="#506a56" strokeWidth="2" strokeLinecap="round" />
      <path d="M24 65H72L66 94Q48 104 30 94Z" fill="#f4e5d7" stroke="#92664b" strokeWidth="2" strokeLinejoin="round" />
      <rect x="21" y="60" width="54" height="11" rx="5" fill="#f7eadf" stroke="#92664b" strokeWidth="2" />
      <circle cx="39" cy="81" r="2" fill="#684c3b" /><circle cx="57" cy="81" r="2" fill="#684c3b" />
      <path d="M44 86Q48 90 52 86" fill="none" stroke="#684c3b" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="34" cy="86" rx="3" ry="2" fill="#e8b5a4" /><ellipse cx="62" cy="86" rx="3" ry="2" fill="#e8b5a4" />
    </svg>
  )
}
