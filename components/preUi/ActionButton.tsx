import React from 'react';
import { ICONS, COLOR_MODERN_BUTTON, COLOR_PRIMARY_DARK } from '../../constants/constants';

type ActionButtonProps = {
    onClick?: (e: React.MouseEvent) => void;
    icon?: typeof ICONS[keyof typeof ICONS];
    label: string;
    isPrimary?: boolean;
    className?: string;
};

const ActionButton = ({ onClick, icon: Icon, label, isPrimary = false, className = '' }: ActionButtonProps) => {
    // Note: Tailwind jit doesn't like dynamic colors inside template literals like this, 
    // but we use the fixed hex in constants to resolve it if the user manually adds them to the safelist/config.
    const baseClasses = "px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center space-x-2 ";
    const primaryClasses = `bg-[${COLOR_MODERN_BUTTON}] text-white hover:bg-[${COLOR_PRIMARY_DARK}]`;
    const secondaryClasses = "border border-gray-300 text-gray-700 hover:bg-gray-100";

    return (
        <button
            onClick={onClick}
            className={`${baseClasses} ${isPrimary ? primaryClasses : secondaryClasses} ${className}`}
        >
            {Icon && <Icon size={16} />}
            <span>{label}</span>
        </button>
    );
};

export default ActionButton;