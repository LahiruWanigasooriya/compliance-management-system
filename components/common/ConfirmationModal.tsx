import { AlertTriangle } from "lucide-react"
import { ReactNode } from "react"

type ConfirmationVariant = "danger" | "warning" | "success" | "info";

interface ConfirmationModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loadingLabel?: string;
  variant?: ConfirmationVariant;
  icon?: ReactNode;
}

const variantStyles: Record<ConfirmationVariant, { iconBg: string; iconColor: string; buttonBg: string; buttonHover: string }> = {
  danger: {
    iconBg: "bg-red-100 dark:bg-red-900/20",
    iconColor: "text-red-600 dark:text-red-400",
    buttonBg: "bg-red-600",
    buttonHover: "hover:bg-red-700",
  },
  warning: {
    iconBg: "bg-yellow-100 dark:bg-yellow-900/20",
    iconColor: "text-yellow-600 dark:text-yellow-400",
    buttonBg: "bg-yellow-600",
    buttonHover: "hover:bg-yellow-700",
  },
  success: {
    iconBg: "bg-green-100 dark:bg-green-900/20",
    iconColor: "text-green-600 dark:text-green-400",
    buttonBg: "bg-green-600",
    buttonHover: "hover:bg-green-700",
  },
  info: {
    iconBg: "bg-blue-100 dark:bg-blue-900/20",
    iconColor: "text-blue-600 dark:text-blue-400",
    buttonBg: "bg-blue-600",
    buttonHover: "hover:bg-blue-700",
  },
};

const ConfirmationModal = ({
  isOpen,
  onCancel,
  onConfirm,
  isLoading = false,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  loadingLabel = "Processing...",
  variant = "danger",
  icon,
}: ConfirmationModalProps) => {
  if (!isOpen) return null;

  const styles = variantStyles[variant];
  const defaultIcon = <AlertTriangle className={`w-6 h-6 ${styles.iconColor}`} />;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-card rounded-xl shadow-2xl max-w-md w-full p-6 border border-border animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center gap-4">
          <div className={`p-3 rounded-full ${styles.iconBg}`}>
            {icon || defaultIcon}
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-semibold text-foreground text-center">
              {title}
            </h3>
            {description && (
              <p className="text-sm text-muted-foreground text-center">
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-2.5 text-sm font-medium text-white ${styles.buttonBg} ${styles.buttonHover} rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? loadingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;

// Legacy support - status-based confirmation (used by existing components)
interface StatusConfirmationModalProps {
  onCancel: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  status?: string;
}

export const StatusConfirmationModal = ({
  onCancel,
  onConfirm,
  isLoading = false,
  status = "pending",
}: StatusConfirmationModalProps) => {
  return (
    <ConfirmationModal
      isOpen={true}
      onCancel={onCancel}
      onConfirm={onConfirm}
      isLoading={isLoading}
      title={`Confirm updating the status to ${status.replace("_", " ")}`}
      description={`Are you sure you want to change the status to ${status.replace("_", " ")}?`}
      confirmLabel="Confirm"
      loadingLabel="Updating..."
      variant="danger"
    />
  );
};
