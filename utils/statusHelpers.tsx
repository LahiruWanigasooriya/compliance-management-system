import { LABEL_MAP } from "@/constants/labelMap.constants";
import { ICONS } from "@/constants/constants";
import { cn } from "@/lib/utils";

export const getStatusWithIcon = (
  status: string | undefined,
  options?: {
    showLabel?: boolean;
    iconSize?: string;
    iconClassName?: string;
    labelPrefix?: string;
  },
) => {
  if (!status) return null;

  const {
    showLabel = true,
    iconSize = "h-3 w-3",
    iconClassName = "inline -translate-y-0.25 mr-1",
    labelPrefix = "",
  } = options || {};

  const config = LABEL_MAP[status.toLowerCase()];
  const Icon = config?.icon || ICONS.AlertCircle;
  const iconColor = config?.color || "text-slate-500";

  if (!Icon) {
    return showLabel
      ? labelPrefix
        ? `${labelPrefix} ${formatStatus(status)}`
        : formatStatus(status)
      : null;
  }

  return (
    <>
      <Icon className={cn(iconSize, iconClassName, iconColor)} />
      {showLabel && (labelPrefix ? `${labelPrefix} ${formatStatus(status)}` : formatStatus(status))}
    </>
  );
};

export const getStatusOptionLabel = (status: string, label: string) => {
  const config = LABEL_MAP[status.toLowerCase()];
  const Icon = config?.icon || ICONS.AlertCircle;
  const iconColor = config?.color || "text-slate-500";

  return (
    <span className="flex items-center gap-1.5">
      {Icon && <Icon className={cn("h-3.5 w-3.5", iconColor)} />}
      {formatStatus(label)}
    </span>
  );
};

const formatStatus = (status: string) => {
  return status
    .split(/[_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};
