import { Button } from "./button";
import { DropdownMenu, DropdownMenuItem, DropdownMenuTrigger } from "./dropdown-menu";
import clsx from "clsx";
import { DropdownMenuContent } from "@radix-ui/react-dropdown-menu";
import { useEffect, useRef, useState } from "react";
import { Separator } from "./separator";
import { ICONS } from "@/constants/constants";
import { FilterProps } from "@/types/common.types";

interface FilterAreaProps {
  appliedFilters: FilterProps[];
  handleRemoveFilter: (filterId: string) => void;
  handleClearAllFilters: () => void
}
const FilterArea = ({
  appliedFilters,
  handleRemoveFilter,
  handleClearAllFilters
}: FilterAreaProps) => {
  const listOfParamsOuterDivRef = useRef<HTMLDivElement>(null);
  const listOfParamsInnerDivRef = useRef<HTMLDivElement>(null);
  const [displayMoreIconInFilterList, setDisplayMoreIconInFilterList] = useState<boolean>(false);
  
  useEffect(() => {
    const handleDisplaySelectedFiltersMoreIcon = () => {
      const outerWidth = listOfParamsOuterDivRef.current?.offsetWidth ?? 0;
      const innerWidth = listOfParamsInnerDivRef.current?.offsetWidth ?? 0;

      setDisplayMoreIconInFilterList(outerWidth <= innerWidth);
    };

    handleDisplaySelectedFiltersMoreIcon();
    globalThis.addEventListener("displayFilterIcon", handleDisplaySelectedFiltersMoreIcon);

    return () =>
      globalThis.removeEventListener("displayFilterIcon", handleDisplaySelectedFiltersMoreIcon);
  }, [appliedFilters]);

  return (
    <div className="flex flex-col gap-5 md:gap-6">
        <div className="flex w-full flex-col gap-4 md:flex-row justify-between items-center">
          <div
            className="relative flex items-left w-full min-w-0 flex-col justify-start gap-4 overflow-hidden rounded-r-full"
            ref={listOfParamsOuterDivRef}
          >
            <div className="flex items-center w-fit min-w-0 shrink-0 gap-2 md:gap-3" ref={listOfParamsInnerDivRef}>
              {appliedFilters.map((filter) => (
              <div key={filter.id} className="flex h-fit min-w-0 shrink-0 items-center gap-1 px-2 py-1 bg-white dark:bg-slate-700 md:h-8 rounded-lg">
                <div className="flex gap-0.5 truncate">
                  <span className="text-sm  text-gray-700 dark:text-gray-100">
                  {filter.label}
                  </span>
                  <span className="text-sm text-gray-700 dark:text-gray-100"> : </span>
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-100 capitalize">
                  {filter.displayValue}
                  </span>
                </div>
                <button
                    onClick={() => handleRemoveFilter(filter.id)}
                    className="flex items-center justify-center transition-colors group p-1 cursor-pointer"
                    disabled={false}
                >
                    <ICONS.XCircle className="w-4 h-4 text-gray-700 dark:text-gray-100" />
                </button>
              </div>
              ))}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div
                    className={clsx(
                      "absolute right-0 z-10 h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-full border-4 bg-white",
                      "md:bg-gray-50 md:border-white",
                      displayMoreIconInFilterList ? "border-gray-50 flex" : "hidden",
                    )}
                  >
                    <ICONS.Ellipsis/>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className={clsx(
                    "text-sm animate-fadeIn custom-scrollbar z-20 flex h-auto max-h-86 min-h-0 max-w-58.25 min-w-0! shrink-0! flex-col gap-1.5 overflow-y-auto rounded-md border-none bg-white p-2 shadow-lg",
                    displayMoreIconInFilterList ? "border-gray-50 flex" : "hidden",
                  )}
                >
                  {appliedFilters.map((filter) => (
                    <>
                      <DropdownMenuItem
                        key={filter.id}
                        className="flex min-w-0 shrink-0 items-center justify-between gap-2 p-1"
                      >
                        <div className="text-gray-700 flex w-full min-w-0 gap-2 flex-wrap wrap-break-word">
                          <p className="shrink-0">{filter.label} :</p>
                          <p className="text-sm font-bold text-center capitalize">{filter.displayValue}</p>
                          
                        </div>
                        <ICONS.XCircle
                          className="text-gray-700 h-4 w-4 cursor-pointer"
                          onClick={() => handleRemoveFilter(filter.id)}
                        />
                      </DropdownMenuItem>
                      <Separator className="bg-gray-50 last:hidden" />
                    </>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <Button
              variant="outline"
              onClick={handleClearAllFilters}
              className="h-11 px-4 py-3 w-full border cursor-pointer text-sm font-bold rounded-lg border-[#1A5276] text-[#1A5276] hover:bg-gray-200 md:w-30"
          >
              Clear Filters
          </Button>
        </div>
    </div>
  )
}

export default FilterArea
