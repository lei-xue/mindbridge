import { Fragment, useId, useState, type ReactNode } from "react"
import { focusRing } from "../lib/ui"
import { useLocale } from "../i18n/LocaleProvider"

export type TableColumn = { key: string; label: string }
export type TableRow = { id: string; cells: ReactNode[] }

export function DirectoryTable({ label, columns, rows, kind, resetKey }: { label: string; columns: TableColumn[]; rows: TableRow[]; kind: "provider" | "resource"; resetKey?: unknown }) {
  const { s } = useLocale()
  const tableId = useId()
  const signature = JSON.stringify(rows.map(row => row.id))
  const [pagination, setPagination] = useState({ signature, resetKey, page: 1 })
  const reset = pagination.signature !== signature || pagination.resetKey !== resetKey
  // Reset before children commit, including returning to a previous city filter.
  if (reset) setPagination({ signature, resetKey, page: 1 })
  const size = kind === "provider" ? 5 : Math.max(1, rows.length)
  const totalPages = Math.max(1, Math.ceil(rows.length / size))
  const page = reset ? 1 : Math.min(pagination.page, totalPages)
  const offset = (page - 1) * size
  const visibleRows = rows.slice(offset, offset + size)
  const start = Math.max(1, Math.min(page - 1, totalPages - 2))
  const pages = [...new Set([1, ...Array.from({ length: Math.min(3, totalPages) }, (_, i) => start + i), totalPages])].sort((a, b) => a - b)
  const changePage = (next: number) => setPagination({ signature, resetKey, page: next })
  const control = `inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-sage-200 px-3 text-sm font-semibold text-teal-800 hover:bg-sage-50 disabled:cursor-default disabled:text-stone-400 disabled:hover:bg-transparent ${focusRing}`
  return <div className="mt-4">
    <div role="region" aria-label={label} tabIndex={0} className={`max-w-full overflow-x-auto rounded ${focusRing}`}>
      <table id={tableId} className="w-full min-w-[700px] border-collapse text-left text-sm">
        <caption className="sr-only">{label}</caption>
        <thead className="bg-sage-50 text-stone-700"><tr>{columns.map(column => <th key={column.key} scope="col" className="px-3 py-3 font-semibold">{column.label}</th>)}</tr></thead>
        <tbody className="divide-y divide-sage-200">{visibleRows.map(row => <tr key={row.id} data-provider={kind === "provider" ? row.id : undefined} data-resource={kind === "resource" ? row.id : undefined} className="align-top hover:bg-sage-50/50">{row.cells.map((cell, index) => index === 0 ? <th key={columns[index].key} scope="row" className="min-w-48 px-3 py-4 font-semibold text-stone-900">{cell}</th> : <td key={columns[index].key} className="px-3 py-4 text-stone-700">{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
    {totalPages > 1 && <div className="mt-3 space-y-2">
      <p data-pagination-summary aria-live="polite" className="text-sm text-stone-600">{s.table.pageSummary(offset + 1, Math.min(offset + size, rows.length), rows.length, page, totalPages)}</p>
      <nav aria-label={s.table.pagination} className="flex flex-wrap items-center gap-1.5">
        <button type="button" aria-controls={tableId} disabled={page === 1} onClick={() => changePage(page - 1)} className={control}>{s.table.previousPage}</button>
        {pages.map((number, index) => <Fragment key={number}>
          {index > 0 && number > pages[index - 1] + 1 && <span aria-hidden="true" className="px-1 text-stone-500">…</span>}
          <button type="button" aria-controls={tableId} aria-label={s.table.pageLabel(number)} aria-current={page === number ? "page" : undefined} onClick={() => changePage(number)} className={`${control} ${page === number ? "border-teal-700 bg-teal-700 text-white hover:bg-teal-800" : ""}`}>{number}</button>
        </Fragment>)}
        <button type="button" aria-controls={tableId} disabled={page === totalPages} onClick={() => changePage(page + 1)} className={control}>{s.table.nextPage}</button>
      </nav>
    </div>}
  </div>
}
