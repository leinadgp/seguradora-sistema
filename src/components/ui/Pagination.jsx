import { ChevronLeft, ChevronRight } from 'lucide-react'

const BTN = 'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-data font-semibold transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed'

export default function Pagination({ page, total, perPage, onChange }) {
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  if (totalPages <= 1) return null

  const from = (page - 1) * perPage + 1
  const to   = Math.min(page * perPage, total)

  function pages() {
    const all = []
    for (let i = 1; i <= totalPages; i++) all.push(i)
    if (totalPages <= 7) return all
    if (page <= 4) return [...all.slice(0, 5), '…', totalPages]
    if (page >= totalPages - 3) return [1, '…', ...all.slice(totalPages - 5)]
    return [1, '…', page - 1, page, page + 1, '…', totalPages]
  }

  return (
    <div className="flex items-center justify-between pt-4 border-t border-cyber-border/40 mt-2">
      <span className="text-xs text-cyber-muted font-data">
        {from}–{to} de {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className={`${BTN} hover:bg-cyber-cyan/10 text-cyber-muted hover:text-cyber-cyan`}
        >
          <ChevronLeft size={14} />
        </button>

        {pages().map((p, i) =>
          p === '…' ? (
            <span key={`e${i}`} className="w-8 text-center text-xs text-cyber-dim select-none">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`${BTN} ${p === page
                ? 'bg-cyber-cyan/15 text-cyber-cyan border border-cyber-cyan/30'
                : 'hover:bg-cyber-cyan/10 text-cyber-muted hover:text-cyber-cyan'}`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className={`${BTN} hover:bg-cyber-cyan/10 text-cyber-muted hover:text-cyber-cyan`}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

export function usePagination(data, perPage = 20) {
  return { paginate: (pg) => data.slice((pg - 1) * perPage, pg * perPage), total: data.length }
}
