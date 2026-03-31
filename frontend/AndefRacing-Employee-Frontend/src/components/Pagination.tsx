interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  if (totalPages <= 1) return null

  // Calculate visible pages with ellipsis for better UX
  const getVisiblePages = () => {
    const pages: (number | 'ellipsis')[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i)
    }

    // Always show first page
    pages.push(0)

    // Calculate start and end for middle pages
    let start = Math.max(1, currentPage - 1)
    let end = Math.min(totalPages - 2, currentPage + 1)

    // Adjust if at the start
    if (currentPage < 2) {
      end = Math.min(totalPages - 2, 2)
    }

    // Adjust if at the end
    if (currentPage > totalPages - 3) {
      start = Math.max(1, totalPages - 3)
    }

    // Add ellipsis if needed
    if (start > 1) {
      pages.push('ellipsis')
    }

    // Add middle pages
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    // Add ellipsis if needed
    if (end < totalPages - 2) {
      pages.push('ellipsis')
    }

    // Always show last page
    if (totalPages > 1) {
      pages.push(totalPages - 1)
    }

    return pages
  }

  const visiblePages = getVisiblePages()

  return (
    <div className="flex justify-center items-center gap-1 sm:gap-2 mt-6 flex-wrap">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
        className="btn-secondary disabled:opacity-50 px-3 py-2 sm:px-6 sm:py-3 text-sm sm:text-base"
      >
        <span className="hidden sm:inline">Назад</span>
        <span className="sm:hidden">←</span>
      </button>

      <div className="flex gap-1">
        {visiblePages.map((page, index) => (
          page === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className="px-2 py-1 text-gray-500">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-2 sm:px-3 py-1 rounded text-sm sm:text-base min-w-[32px] sm:min-w-[36px] ${
                currentPage === page
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {page + 1}
            </button>
          )
        ))}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages - 1}
        className="btn-secondary disabled:opacity-50 px-3 py-2 sm:px-6 sm:py-3 text-sm sm:text-base"
      >
        <span className="hidden sm:inline">Вперед</span>
        <span className="sm:hidden">→</span>
      </button>
    </div>
  )
}

export default Pagination
