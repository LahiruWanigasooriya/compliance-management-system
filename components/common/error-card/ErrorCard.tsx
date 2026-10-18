import { ICONS } from "@/constants/constants"
interface ErrorCardProps {
  title: string;
  description: string;
  className?: string;
}

const ErrorCard = ({
  title,
  description,
  className = "",
}: ErrorCardProps) => {
  return (
    <div className={`bg-red-50 border border-red-200 rounded-xl p-6 max-w-md ${className}`}>
        <div className="flex items-center space-x-3 mb-3">
            <ICONS.AlertTriangle className="text-red-600" size={24} />
            <h2 className="text-lg font-semibold text-red-900">
                {title}
            </h2>
        </div>
        <p className="text-red-700 mb-4">
            {description}
        </p>
    </div>
  )
}

export default ErrorCard
