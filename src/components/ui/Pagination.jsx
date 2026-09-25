export default function Pagination({ meta, onPage }) {
  if (!meta || meta.last_page <= 1) return null
  const pages = Array.from({ length: meta.last_page }, (_, i) => i + 1)

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
      <p className="text-sm text-gray-500">
        Showing {meta.from}–{meta.to} of {meta.total}
      </p>
      <div className="flex gap-1">
        {pages.map(p => (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              p === meta.current_page
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  )
}
