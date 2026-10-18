import { ICONS } from "@/constants/constants";

interface CloseButtonProps {
  onClick: () => void;
  className?: string;
}

const CloseButton = ({
  onClick,
  className = ""
}: CloseButtonProps) => {
  return (
    <button 
    onClick={onClick}
    className={`absolute -top-2 -right-2 md:-top-3 md:-right-3 h-6 w-6 rounded-full cursor-pointer p-0 hover:bg-gray-100 flex items-center justify-center z-10 ${className}`}
    >
        <ICONS.XCircle size={20} className="text-gray-700"/>
    </button>
  )
}

export default CloseButton
