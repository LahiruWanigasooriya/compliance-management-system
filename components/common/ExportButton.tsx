"use client";

import { ICONS } from "@/constants/constants";
import Loader from "@/components/ui/loader/Loader";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface ExportButtonProps {
  onExport: (format: "pdf" | "csv" | "json") => void;
  isExporting: boolean;
  className?: string;
}

export default function ExportButton({
  onExport,
  isExporting,
  className = "",
}: ExportButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`cursor-pointer flex items-center space-x-1.5 px-3 py-2.5 bg-[#1A5276] text-white rounded-lg hover:bg-[#001F3F] transition-colors text-sm font-medium disabled:cursor-not-allowed disabled:opacity-70 dark:bg-[#2a5a5f] dark:hover:bg-[#1f4648] ${className}`}
          disabled={isExporting}
        >
          {!isExporting && <ICONS.Download size={16} />}
          {isExporting ? (
            <>
              <Loader size="12" className="h-4 w-4" lightColor="white" stroke="1" />
              <span>Exporting...</span>
            </>
          ) : (
            <span>Export</span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => void onExport("pdf")}>
          PDF
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void onExport("csv")}>
          CSV
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void onExport("json")}>
          JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
