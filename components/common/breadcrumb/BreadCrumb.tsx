import Link from "next/link";

export interface BreadCrumbItem {
  label: string;
  href?: string; 
}

interface BreadCrumbProps {
  items: BreadCrumbItem[];
  className?: string;
}

const BreadCrumb = ({
  items,
  className = "",    
}: BreadCrumbProps) => {
  if(!items || items.length === 0) return null;

  return (
    <nav className={`no-scrollbar text-sm flex items-center overflow-x-auto whitespace-nowrap ${className}`}>
        {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
                <span key={item.label} className="flex items-center">
                    {index > 0 && (
                        <span className="text-gray-600 dark:text-white mx-1">&gt;</span>
                    )}
                    {item.href && !isLast ? (
                        <Link
                            href={item.href}
                            className="text-gray-600 dark:text-white transition-colors hover:text-[#1A5276]"
                        >
                            {item.label}
                        </Link>
                    ) : (
                        <span className="text-gray-600 dark:text-white">
                            {item.label}
                        </span>
                    )}
                </span>
            )
        })}
    </nav>
  )
}

export default BreadCrumb;
