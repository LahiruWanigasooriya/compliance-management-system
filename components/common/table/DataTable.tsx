import React from "react";

export interface Column<T> {
  key: string;
  label: string;
  render?: (
    value: any,
    row: T,
    handlers?: any,
    page?: number,
    limit?: number
  ) => React.ReactNode;
  className?: string;
  sortable?: boolean;
  horizontalSeparator?: boolean;
}

type Props<T> = Readonly<{
  data: T[];
  columns: Column<T>[];
  rowKey?: (row: T, index: number) => string | number;
  onRowClick?: (row: T) => void;
  sortable?: boolean;
  onSort?: (key: string, direction: "asc" | "desc") => void;
  sortKey?: string;
  sortDirection?: "asc" | "desc";
  limit?: number;
  page?: number;
  hidingColumns?: string[];
}>;

export function DataTable<T>({
  data,
  columns,
  rowKey = (_, i) => i,
  onRowClick,
  sortable = false,
  onSort,
  sortKey,
  sortDirection,
  page,
  limit,
  hidingColumns = [],
}: Props<T>) {
  const handleSort = (column: Column<T>) => {
    if (!sortable || !column.sortable || !onSort) return;

    const newDirection =
      sortKey === column.key && sortDirection === "asc" ? "desc" : "asc";
    onSort(column.key, newDirection);
  };

  const getSortIcon = (columnKey: string) => {
    if (sortKey !== columnKey) {
      return (
        <div className="flex flex-col">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M10.1221 2.14445C10.3396 1.95185 10.6604 1.95185 10.8779 2.14445L16.2972 6.94444C16.5407 7.16009 16.5689 7.53887 16.3602 7.79046C16.1515 8.04206 15.7849 8.0712 15.5415 7.85554L10.5 3.39024L5.45853 7.85554C5.21505 8.0712 4.84849 8.04206 4.6398 7.79046C4.4311 7.53887 4.4593 7.16009 4.70278 6.94444L10.1221 2.14445Z"
              fill="#FFFFFF"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M10.1221 17.8556C10.3396 18.0481 10.6604 18.0481 10.8779 17.8556L16.2972 13.0556C16.5407 12.8399 16.5689 12.4611 16.3602 12.2095C16.1515 11.9579 15.7849 11.9288 15.5415 12.1445L10.5 16.6098L5.45853 12.1445C5.21505 11.9288 4.84849 11.9579 4.6398 12.2095C4.4311 12.4611 4.4593 12.8399 4.70278 13.0556L10.1221 17.8556Z"
              fill="#FFFFFF"
            />
          </svg>
        </div>
      );
    }

    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={sortDirection === "desc" ? "rotate-180" : ""}
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M10.1221 2.14445C10.3396 1.95185 10.6604 1.95185 10.8779 2.14445L16.2972 6.94444C16.5407 7.16009 16.5689 7.53887 16.3602 7.79046C16.1515 8.04206 15.7849 8.0712 15.5415 7.85554L10.5 3.39024L5.45853 7.85554C5.21505 8.0712 4.84849 8.04206 4.6398 7.79046C4.4311 7.53887 4.4593 7.16009 4.70278 6.94444L10.1221 2.14445Z"
          fill="currentColor"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M10.1221 17.8556C10.3396 18.0481 10.6604 18.0481 10.8779 17.8556L16.2972 13.0556C16.5407 12.8399 16.5689 12.4611 16.3602 12.2095C16.1515 11.9579 15.7849 11.9288 15.5415 12.1445L10.5 16.6098L5.45853 12.1445C5.21505 11.9288 4.84849 11.9579 4.6398 12.2095C4.4311 12.4611 4.4593 12.8399 4.70278 13.0556L10.1221 17.8556Z"
          fill="currentColor"
        />
      </svg>
    );
  };
  const filteredColumns = columns.filter(
    (col) => !hidingColumns.includes(col.key)
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 shrink-0 w-full rounded-t-xl">
      <div className="flex min-h-0 w-full">
        <table className="min-w-max table-auto border-collapse w-full">
          <thead className="sticky top-0 z-10 bg-secondary dark:bg-secondary">
            <tr>
              {filteredColumns.map((col, j) => (
                <th
                  key={col.key}
                  className={`text-sm p-3 text-left text-ellipsis whitespace-nowrap font-semibold text-white ${
                    col.className
                  } ${
                    sortable && col.sortable ? "hover:bg-secondary/90 dark:hover:bg-secondary/90 cursor-pointer" : ""
                  } ${
                    j === filteredColumns.length - 1
                      ? "sticky right-0 rounded-tr-xl bg-secondary dark:bg-secondary"
                      : ""
                  } ${
                    j === 0 ? "rounded-tl-xl" : ""
                  }`}
                >
                  <div
                    className={`flex gap-2 ${
                      j === filteredColumns.length - 1 ? "justify-end" : ""
                    }`}
                  >
                    {col.label}
                    <button
                      className="cursor-pointer text-white"
                      onClick={() => handleSort(col)}
                    >
                      {sortable && col.sortable && getSortIcon(col.key)}
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="">
            {data?.map((row, i) => {
              const isLocked = Boolean((row as any).isAccountLocked);
              return (
                <tr
                  key={rowKey(row, i)}
                  className={`group border-b border-panel-border bg-card hover:bg-[#394f4d17] dark:hover:bg-[#394f4d] ${
                    isLocked ? "pointer-events-none" : ""
                  }`}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {filteredColumns.map((col, j) => {
                    const value = (row as any)[col.key];
                    const isActionsColumn = col.key === "actions";

                    return (
                      <td
                        key={col?.key}
                        className={`text-sm text-foreground py-2.5 px-3 text-ellipsis whitespace-nowrap ${
                          j === filteredColumns.length - 1
                            ? "text-right sticky right-0 bg-card before:content-[''] before:absolute before:inset-0 before:bg-[#394f4d17] before:opacity-0 group-hover:before:opacity-100 before:pointer-events-none before:z-[-1] dark:before:hidden dark:group-hover:bg-[#394f4d]"
                            : ""
                        } ${col.className}`}
                        style={
                          isLocked && isActionsColumn
                            ? { pointerEvents: "auto" }
                            : {}
                        }
                      >
                        {col.render
                          ? col.render(value, row, i, page, limit)
                          : value}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
