import React from 'react';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ page, pageSize, total, onPageChange }) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages === 1) return null;

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  // Build visible page numbers: always show first, last, current ±1, with ellipsis gaps
  const pages: (number | '...')[] = [];
  const add = (n: number) => {
    if (!pages.includes(n)) pages.push(n);
  };

  add(1);
  if (page - 2 > 2) pages.push('...');
  for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) add(i);
  if (page + 2 < totalPages - 1) pages.push('...');
  if (totalPages > 1) add(totalPages);

  return (
    <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
      <p className="text-xs text-gray-400">
        {total === 0 ? '0 results' : `${from}–${to} of ${total}`}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="px-2 py-1 rounded text-sm text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ‹
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="px-1 text-sm text-gray-400 select-none">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={`min-w-[28px] px-2 py-1 rounded text-sm transition-colors ${
                p === page
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="px-2 py-1 rounded text-sm text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ›
        </button>
      </div>
    </div>
  );
};
