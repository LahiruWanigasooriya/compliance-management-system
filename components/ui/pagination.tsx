import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "./dropdown-menu";
import { useRef } from "react";
import { cn } from "../../lib/utils";
import { ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";

type PaginationProps = Readonly<{
  currentPage: number;
  totalPages: number;
  isLoading?: boolean;
  onPageChange?: (page: number) => void;
  className?: string;
  limit?: number;
  total?: number;
  results?: boolean;
  pageSizes?: number[];
  setSelectedPageLimit?: (value: number) => void;
  selectedPageLimit?: number;
}>;

export function Pagination({
  currentPage,
  totalPages,
  isLoading = false,
  onPageChange,
  className = "",
  limit,
  total,
  results = false,
  pageSizes,
  setSelectedPageLimit,
  selectedPageLimit,
}: PaginationProps) {
  //const [searchParams] = useSearchParams();
  const numbersRowWidth = useRef<HTMLDivElement | null>(null);

  const changePage = (page: number) => {
    if (onPageChange) {
      onPageChange(page);
    } else {
      //const params = new URLSearchParams(searchParams.toString());
      //params.set("page", String(page));
      //navigate(`?${params.toString()}`);
    }
  };

  const renderPageNumbers = () => {
    const pageNumbers: (number | string)[] = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pageNumbers.push(1, 2, 3, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
      } else {
        pageNumbers.push(
          1,
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          totalPages
        );
      }
    }

    return pageNumbers;
  };

  return (
    <div
      className={`flex flex-col items-center md:flex-row ${
        results
          ? "justify-center gap-4 md:justify-between md:gap-0"
          : "justify-center"
      }`}
    >
      {results && (
        <div className="text-sm text-muted-foreground md:block hidden">
          <p>
            Results:{" "}
            {`${(currentPage - 1) * (limit ?? 10) + 1} - ${Math.min(
              currentPage * (limit ?? 10),
              total ?? 0
            )} of ${total}`}
          </p>
        </div>
      )}
      <div
        className={`flex w-full md:max-w-86 items-center justify-between lg:w-auto md:justify-center md:gap-5 gap-0 md:px-0 ${className}`}
        ref={numbersRowWidth}
      >
        <Button
          onClick={() => changePage(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
          variant="outline"
          size="icon"
          className={`flex shrink-0 h-8 w-8 rounded-full p-0 ${
            currentPage === 1 || isLoading
              ? "border-gray-100 text-gray-100 cursor-not-allowed"
              : "cursor-pointer border-emerald-400! text-emerald-400! hover:text-emerald-600! hover:border-emerald-600!"
          }`}
        >
          <ArrowLeft />
        </Button>

        <div className="flex md:gap-5 gap-2 justify-center items-center">
          {renderPageNumbers().map((pageNum) => (
            <Button
              key={pageNum}
              onClick={() => typeof pageNum === "number" && changePage(pageNum)}
              disabled={isLoading || typeof pageNum === "string"}
              variant={
                typeof pageNum === "number" && currentPage === pageNum
                  ? "default"
                  : "secondary"
              }
              size="sm"
              className={`cursor-pointer transition-colors flex shrink-0 h-8 w-8 rounded-full p-0 m-0 border-none text-md ${
                typeof pageNum === "number"
                  ? currentPage === pageNum
                    ? "hover:bg-emerald-600 bg-emerald-500 text-white"
                    : isLoading
                    ? "cursor-not-allowed text-gray-300"
                    : "bg-transparent border border-transparent text-gray-600 hover:bg-gray-300"
                  : "cursor-default border-none text-gray-500"
              }`}
            >
              {pageNum}
            </Button>
          ))}
        </div>

        <Button
          onClick={() => changePage(currentPage + 1)}
          disabled={currentPage === totalPages || isLoading}
          variant="outline"
          size="icon"
          className={`flex shrink-0 h-8 w-8 rounded-full ${
            currentPage === totalPages || isLoading
              ? "border-gray-100 text-gray-100 cursor-not-allowed"
              : "cursor-pointer border-emerald-400! text-emerald-400! hover:text-emerald-600! hover:border-emerald-600!"
          }`}
        >
          <ArrowRight />
        </Button>
      </div>
      {results && (
        <div className="text-sm flex w-full items-center justify-between gap-2 md:w-auto">
          <p className="block md:hidden text-muted-foreground">
            Results per page
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="text-gray-900 md:text-white md:bg-gray-700 dark:md:text-white hover:bg-gray-900 flex items-center h-auto gap-2 rounded-lg bg-white px-3 py-1.5 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none data-[state=open]:bg-gray-300 data-[state=open]:md:bg-gray-900 cursor-pointer">
                <div className="flex gap-2 items-center">
                  <p className="text-sm font-bold">{selectedPageLimit ?? 10}</p>
                  <ArrowDown className="h-5 w-5" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="border-panel-border text-sm z-20 min-w-18 bg-white dark:bg-slate-900"
              align="center"
            >
              {pageSizes?.map((item) => (
                <DropdownMenuItem
                  key={item}
                  className={cn(
                    "hover:bg-gray-50 dark:text-slate-50 cursor-pointer focus:ring-0 focus:outline-none",
                    selectedPageLimit === item && "text-emerald-500 font-bold"
                  )}
                  onSelect={() => setSelectedPageLimit?.(item)}
                >
                  {item}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <p className="hidden md:block text-muted-foreground">
            Results per page
          </p>
        </div>
      )}
    </div>
  );
}
