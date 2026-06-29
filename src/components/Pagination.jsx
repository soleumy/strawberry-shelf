import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <nav className="pagination" aria-label="Paginación">
      <button
        type="button"
        className="secondary-action"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft size={16} /> Anterior
      </button>

      <span className="pagination-info">
        Página {page} de {totalPages}
      </span>

      <button
        type="button"
        className="secondary-action"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Siguiente <ChevronRight size={16} />
      </button>
    </nav>
  );
}
