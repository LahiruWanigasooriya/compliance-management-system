import { Column } from "@/components/common/table/DataTable";
import { ActionButtons } from "@/components/common/table/SharedColumns";
import { GeoLog } from "@/types/geolocation.types";
import { convertDate } from "@/utils/convertDate";
import { ICONS } from "@/constants/constants";
import CopyableText from "@/components/common/copyable-text/CopyableText";

const getSeverityStyles = (severity: string) => {
  switch (severity?.toLowerCase()) {
    case "critical":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
    case "high":
    case "error":
      return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
    case "medium":
    case "warning":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
    case "low":
    case "info":
    default:
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
  }
};

const getActionStyles = (action: string) => {
  const lowerAction = action?.toLowerCase() || "";
  if (lowerAction.includes("create") || lowerAction.includes("add")) {
    return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
  }
  if (lowerAction.includes("delete") || lowerAction.includes("remove")) {
    return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  }
  if (lowerAction.includes("update") || lowerAction.includes("edit") || lowerAction.includes("modify")) {
    return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
  }
  if (lowerAction.includes("view") || lowerAction.includes("read") || lowerAction.includes("get")) {
    return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
  }
  return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
};

const formatLabel = (value: string) => {
  if (!value) return "N/A";
  return value.replaceAll("_", " ");
};

export const createAuditLogColumns = (
  handleViewLog: (log: GeoLog) => void
): Column<GeoLog>[] => {
  return [
    {
      key: "id",
      label: "Log ID",
      className: "min-w-[120px]",
      sortable: false,
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <ICONS.FileText size={14} className="text-muted-foreground" />
          <span className="text-foreground text-xs min-w-27 flex justify-end text-left">
            {/* {value?.slice(0, 8)}... */}
            <CopyableText text={value} truncate iconClassName="!translate-y-0" />
          </span>
        </div>
      ),
    },
    {
      key: "action",
      label: "Action",
      className: "min-w-[140px] ",
      sortable: true,
      render: (value: string) => (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getActionStyles(value)}`}
        >
          {formatLabel(value)}
        </span>
      ),
    },
    {
      key: "resource",
      label: "Resource",
      className: "min-w-[120px]",
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <ICONS.Database size={14} className="text-muted-foreground" />
          <span className="text-foreground capitalize">{formatLabel(value)}</span>
        </div>
      ),
    },
    {
      key: "severity",
      label: "Severity",
      className: "min-w-[100px] text-center [&>div]:justify-center",
      sortable: true,
      render: (value: string) => (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getSeverityStyles(value)}`}
        >
          {value || "Info"}
        </span>
      ),
    },
    {
      key: "performed_by",
      label: "Performed By",
      className: "min-w-[140px]",
      sortable: false,
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-[#1A5276]/10 flex items-center justify-center">
            <ICONS.User size={12} className="text-[#1A5276]" />
          </div>
          {/* <span className="text-foreground text-sm">{value || "System"}</span> */}
          <span className="text-foreground text-xs  flex justify-end text-left">
            {/* {value?.slice(0, 8)}... */}
            <CopyableText text={value || "System"}  iconClassName="!translate-y-0" />
          </span>
        </div>
      ),
    },
    {
      key: "created_at",
      label: "Timestamp",
      className: "min-w-[160px]",
      sortable: true,
      render: (value: string) => {
        const date = convertDate(value, "YYYY-MM-DD HH:mm:ss");
        return (
          <div className="flex items-center gap-2">
            <ICONS.Clock size={14} className="text-muted-foreground" />
            <span className="text-foreground text-xs font-mono">{date}</span>
          </div>
        );
      },
    },
    {
      key: "_id",
      label: "Actions",
      className: "text-right min-w-[100px]",
      sortable: false,
      render: (_value: string, row: GeoLog) => (
        <ActionButtons
          className="gap-2 justify-end"
          onView={() => handleViewLog(row)}
        />
      ),
    },
  ];
};
