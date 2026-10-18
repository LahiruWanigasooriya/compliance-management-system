"use client";

import { useMemo } from "react";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalRecords: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

export const getTotalPages = (totalRecords: number, pageSize: number) =>
  Math.max(1, Math.ceil(totalRecords / pageSize));

export const getSafePage = (currentPage: number, totalPages: number) =>
  Math.min(Math.max(currentPage, 1), totalPages);

export const getPageNumbers = (
  currentPage: number,
  totalPages: number,
  maxVisible = 5
) => {
  const pages: number[] = [];
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  const end = Math.min(totalPages, start + maxVisible - 1);
  start = Math.max(1, end - maxVisible + 1);

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  return pages;
};

export const getPageRange = (
  currentPage: number,
  pageSize: number,
  totalRecords: number
) => ({
  startItem: Math.min((currentPage - 1) * pageSize + 1, totalRecords),
  endItem: Math.min(currentPage * pageSize, totalRecords),
});

export default function PaginationControls({
  currentPage,
  totalPages,
  pageSize,
  totalRecords,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  className = "",
}: PaginationControlsProps) {
  const pageNumbers = useMemo(() => {
    return getPageNumbers(currentPage, totalPages);
  }, [currentPage, totalPages]);

  const { startItem, endItem } = getPageRange(
    currentPage,
    pageSize,
    totalRecords
  );

  return (
    <div
      className={`mt-4 flex flex-col gap-3 rounded-xl border border-gray-200 bg-card p-4 shadow-sm md:flex-row md:items-center md:justify-between dark:border-[#1b3b2d]  ${className}`}
    >
      <div className="text-sm text-gray-600 dark:text-[#9fb5a9]">
        Showing <span className="font-medium text-foreground">{(startItem).toLocaleString()}</span>{" "}
        - <span className="font-medium text-foreground">{(endItem).toLocaleString()}</span> of{" "}
        <span className="font-medium text-foreground">{(totalRecords).toLocaleString()}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#1b3b2d] dark:text-[#cfe0d7] dark:hover:bg-[#02450A] cursor-pointer"
        >
          First
        </button>
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#1b3b2d] dark:text-[#cfe0d7] dark:hover:bg-[#02450A] cursor-pointer"
        >
          Prev
        </button>
        {pageNumbers.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
              currentPage === page
                ? "border-[#1A5276] bg-[#1A5276] text-white dark:border-[#2a5a5f] dark:bg-[#2a5a5f] dark:text-[#e9f3ee]"
                : "border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-[#1b3b2d] dark:text-[#cfe0d7] dark:hover:bg-[#02450A]"
            }`}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#1b3b2d] dark:text-[#cfe0d7] dark:hover:bg-[#02450A] cursor-pointer"
        >
          Next
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#1b3b2d] dark:text-[#cfe0d7] dark:hover:bg-[#02450A] cursor-pointer"
        >
          Last
        </button>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-[#9fb5a9]">
        <span>Rows</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="cursor-pointer rounded-lg border bg-card border-gray-300 px-2 py-1.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-600 dark:border-[#1b3b2d]  dark:text-[#e9f3ee] dark:focus:ring-[#2a5a5f]"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
