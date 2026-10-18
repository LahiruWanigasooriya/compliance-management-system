import { ICONS } from "@/constants/constants";

export const ToggleButton = ({
  isActive,
  onClick,
  className = "",
  title,
}: {
  isActive: boolean;
  onClick?: () => void;
  className?: string;
  title?: string;
}) => (
  <button
    onClick={onClick}
    title={
      title ?? (isActive ? "Click to disable user" : "Click to enable user")
    }
    className={`relative h-5 w-9 rounded-full transition-all duration-200 focus:outline-none ${
      isActive ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"
    } ${className}`}
    type="button"
  >
    <div
      className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform duration-200 ${
        isActive ? "translate-x-4.5" : "translate-x-0.5"
      }`}
    ></div>
  </button>
);

export const ActionButtons = ({
  onView,
  onToggle,
  onAction,
  onEdit,
  onDelete,
  onUnlock,
  isActive,
  isLocked,
  className = "",
  classNameOfEditButton = "",
}: {
  onView?: () => void;
  onToggle?: () => void;
  onAction?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onUnlock?: () => void;
  isActive?: boolean;
  isLocked?: boolean;
  className?: string;
  classNameOfEditButton?: string;
}) => {
  return (
    <div className={`flex items-center justify-end gap-3 ${className}`}>
      {onToggle && (
        <ToggleButton
          isActive={isActive || false}
          onClick={isLocked ? undefined : onToggle}
          className={
            isLocked ? "pointer-events-none cursor-not-allowed opacity-50" : ""
          }
        />
      )}
      {onView && (
        <button
          className={`flex h-6 w-6 cursor-pointer items-center justify-center p-0.5 text-foreground ${
            isLocked ? "pointer-events-none cursor-not-allowed opacity-50" : ""
          }`}
          onClick={(e) => {
            if (isLocked) {
              e.preventDefault();
              e.stopPropagation();
              return;
            }
            onView();
          }}
        >
          <ICONS.Eye size={18} />
        </button>
      )}

      {isLocked && onUnlock ? (
        <button
          className="flex h-6 w-6 cursor-pointer items-center justify-center rounded p-0.5 transition-colors text-foreground"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onUnlock();
          }}
          title="Unlock Merchant"
          type="button"
        >
          <ICONS.Lock size={18} />
        </button>
      ) : (
        onAction && (
          <button
            onClick={(e) => {
              if (isLocked) {
                e.preventDefault();
                e.stopPropagation();
                return;
              }
              onAction();
            }}
            className={`flex h-6 w-6 items-center justify-center p-0.5 text-foreground ${
              isLocked
                ? "pointer-events-none cursor-not-allowed opacity-50"
                : ""
            }`}
          >
            <ICONS.Activity size={18} />
          </button>
        )
      )}

      {onEdit && (
        <button
          className={`flex h-6 w-6 cursor-pointer items-center justify-center p-0.5 text-foreground ${
            isLocked ? "pointer-events-none cursor-not-allowed opacity-50" : ""
          } ${classNameOfEditButton}`}
          onClick={(e) => {
            if (isLocked) {
              e.preventDefault();
              e.stopPropagation();
              return;
            }
            onEdit();
          }}
        >
          <ICONS.Edit size={18} />
        </button>
      )}

      {onDelete && (
        <button
          type="button"
          onClick={(e) => {
            if (isLocked) {
              e.preventDefault();
              e.stopPropagation();
              return;
            }
            onDelete();
          }}
          className={`flex h-6 w-6 cursor-pointer items-center justify-center p-0.5 text-foreground ${
            isLocked ? "pointer-events-none cursor-not-allowed opacity-50" : ""
          }`}
        >
          <ICONS.Trash2 size={18} />
        </button>
      )}
    </div>
  );
};
