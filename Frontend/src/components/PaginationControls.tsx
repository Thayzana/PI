import { ChevronLeft, ChevronRight } from "lucide-react";
import { getTotalPages } from "../lib/pagination";

interface PaginationControlsProps {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function PaginationControls({
  page,
  pageSize,
  totalItems,
  onPageChange,
  className = "",
}: PaginationControlsProps) {
  const totalPages = getTotalPages(totalItems, pageSize);
  if (totalItems <= pageSize) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-[#eee7de] ${className}`}
    >
      <span className="text-[10px] text-[#7d6f6b] font-medium">
        Exibindo {start}–{end} de {totalItems}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="p-1.5 rounded-lg border border-[#eee7de] text-[#7d6f6b] hover:bg-[#faf7f2] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          aria-label="Página anterior"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="text-[10px] font-bold text-[#2e2624] min-w-[72px] text-center">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="p-1.5 rounded-lg border border-[#eee7de] text-[#7d6f6b] hover:bg-[#faf7f2] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          aria-label="Próxima página"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
