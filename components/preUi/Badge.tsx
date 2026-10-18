import React from 'react';

type BadgeProps = {
    colorClass: string
    children: React.ReactNode
}
const Badge = ({ colorClass, children }: BadgeProps) => (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${colorClass}`}>
        {children}
    </span>
);

export default Badge;