import { ChevronRight } from "lucide-react";
import Link from "next/link";
import React from "react";

export default function DashboardCard({
  title,
  desc,
  href,
  icon,
  stat,
  statColor = "text-slate-600 bg-slate-100 dark:bg-slate-700 dark:text-slate-300",
}: any) {
  return (
    <Link href={href} className="block group">
      <div className="bg-card p-5 rounded-xl border border-panel-border shadow-sm hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-200 h-full flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-3">
            <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-colors">
              {React.cloneElement(icon, { size: 24 })}
            </div>

            {stat && (
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${statColor}`}
              >
                {stat}
              </span>
            )}
          </div>

          <h3 className="font-bold text-foreground mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {desc}
          </p>
        </div>

        <div className="mt-4 flex items-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-200">
          Manage <ChevronRight className="w-3 h-3 ml-1" />
        </div>
      </div>
    </Link>
  );
}
