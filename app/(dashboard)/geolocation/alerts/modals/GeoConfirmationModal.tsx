import { CircleQuestionMark } from "lucide-react"

interface GeoConfirmationModalProps {
  onCancel: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  status?: string;
}
const GeoConfirmationModal = ({
  onCancel,
  onConfirm,
  isLoading = false,
  status = "in_progress",
}: GeoConfirmationModalProps) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-100 p-4">
        <div className="bg-card rounded-lg shadow-2xl max-w-md w-full p-6 border border-panel-border">
            <div className="flex flex-col items-center gap-4">
                <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                    <CircleQuestionMark className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-semibold text-foreground text-center">
                      Confirm updating the status to <span className="capitalize">{status.replace("_"," ")}</span>
                  </h3>
                  <p className="text-sm text-muted-foreground text-center px-16">
                      Are you sure you want to change the status of alert to <span className="capitalize">{status.replace("_"," ")}</span>?
                  </p>
                </div>
            </div>

            <div className="flex gap-3 mt-6">
                <button
                onClick={onCancel}
                className="flex-1 px-4 py-2 text-sm font-medium text-foreground bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                >
                Cancel
                </button>
                <button
                onClick={onConfirm}
                disabled={isLoading}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer"
                >
                {isLoading ? "Updating..." : "Confirm"}
                </button>
            </div>
        </div>
    </div>
  )
}

export default GeoConfirmationModal
