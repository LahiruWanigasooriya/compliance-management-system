import React from "react";
import { Separator } from "../../ui/separator";
import type { Column } from "../table/DataTable";

interface DataCardProps<T> {
  data: T;
  className?: string;
  otherClassName?: string;
  columns: Column<T>[];
  isFirstRowNormal?: boolean;
  isPopUpShowing?: boolean;
  firstRowDivider?: boolean;
  hideColumn?: string;
  isLastRowCentered?: boolean;
  hideHorizontalSeparator?: boolean;
  hidingColumns?: string[];
}

const DataCard = <T extends object>({
  data,
  className = "",
  otherClassName = "",
  columns,
  isFirstRowNormal = false,
  isPopUpShowing = false,
  firstRowDivider = true,
  isLastRowCentered = false,
  hideHorizontalSeparator = false,
  hideColumn = "",
  hidingColumns = [],
}: DataCardProps<T>) => {
  const filteredColumns = columns.filter(
    (col) => !hidingColumns.includes(col.key)
  );
  return (
    <div
      className={`text-sm flex flex-col gap-2 rounded-lg p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-panel-border text-gray-900 dark:text-gray-100 ${className}`}
    >
      <div
        className={`flex flex-col justify-center gap-2 rounded-lg ${otherClassName} bg-gray-50 dark:bg-slate-800`}
      >
        {(isPopUpShowing ? filteredColumns.slice(0, -1) : filteredColumns)?.map(
          (column, index) => {
            const value = (data as any)[column.key];
            const isLast = index === filteredColumns.length - 1;
            return (
              <React.Fragment key={column.key}>
                {index === 0 && firstRowDivider && !isFirstRowNormal ? (
                  <div className="flex flex-col justify-center gap-3">
                    <div
                      className={`flex items-center justify-start ${column.className}`}
                    >
                      {column?.render
                        ? column?.render(value, data)
                        : column.label}
                    </div>
                    <hr className="text-gray-100 dark:text-gray-700" />
                  </div>
                ) : (
                  <>
                    <div
                      className={`flex items-center ${column.className} ${
                        hideColumn === column.key
                          ? "justify-center"
                          : "justify-between"
                      } ${
                        isLastRowCentered && isLast
                          ? "justify-center border-t border-gray-200 dark:border-panel-border pt-3"
                          : "justify-between"
                      }`}
                    >
                      <p
                        className={`${
                          hideColumn === column.key ? "hidden" : "block"
                        } ${isLastRowCentered && isLast ? "hidden" : ""}`}
                      >
                        {column.label}
                      </p>
                      {column?.render ? (
                        column?.render(value, data)
                      ) : (
                        <p>{String(data[column.key as keyof T])}</p>
                      )}
                    </div>
                    {column.horizontalSeparator && !hideHorizontalSeparator && (
                      <Separator className="bg-gray-50 dark:bg-slate-800" />
                    )}
                  </>
                )}
              </React.Fragment>
            );
          }
        )}
      </div>
    </div>
  );
};

export default DataCard;
