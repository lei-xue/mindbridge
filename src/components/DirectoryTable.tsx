import type { ReactNode } from "react"
import { focusRing } from "../lib/ui"

export type TableColumn = { key: string; label: string }
export type TableRow = { id: string; cells: ReactNode[] }

export function DirectoryTable({ label, columns, rows, kind }: { label: string; columns: TableColumn[]; rows: TableRow[]; kind: "provider" | "resource" }) {
  return <div role="region" aria-label={label} tabIndex={0} className={`mt-4 max-w-full overflow-x-auto rounded ${focusRing}`}>
    <table className="w-full min-w-[700px] border-collapse text-left text-sm">
      <caption className="sr-only">{label}</caption>
      <thead className="bg-sage-50 text-stone-700"><tr>{columns.map(column => <th key={column.key} scope="col" className="px-3 py-3 font-semibold">{column.label}</th>)}</tr></thead>
      <tbody className="divide-y divide-sage-200">{rows.map(row => <tr key={row.id} data-provider={kind === "provider" ? row.id : undefined} data-resource={kind === "resource" ? row.id : undefined} className="align-top hover:bg-sage-50/50">{row.cells.map((cell, index) => index === 0 ? <th key={columns[index].key} scope="row" className="min-w-48 px-3 py-4 font-semibold text-stone-900">{cell}</th> : <td key={columns[index].key} className="px-3 py-4 text-stone-700">{cell}</td>)}</tr>)}</tbody>
    </table>
  </div>
}
