import { ICONS } from '@/constants/constants'
import { ReactNode } from 'react';
interface EmptyResultProps {
  title: string;
  description: string;
  icon?: ReactNode;
  className?: string;
}
const EmptyResult = ({
  title,
  description,
  icon,
  className,
}: EmptyResultProps) => {
  return (
    <div className={`bg-card rounded-xl border border-panel-border shadow-sm p-12 text-center ${className}`}>
      {icon ?? (
        <ICONS.Bell
        className="mx-auto text-muted-foreground mb-4 dark:text-gray-500"
        size={48}
        />
      )}
        <h3 className="text-lg font-semibold text-foreground mb-2 dark:text-gray-100">
            {title}
        </h3>
        <p className="text-muted-foreground mb-4 dark:text-gray-400">
            {description}
        </p>
    </div>
  )
}

export default EmptyResult
