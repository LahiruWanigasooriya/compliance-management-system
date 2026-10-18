import React from "react";

interface TooltipProps {
  children: React.ReactNode;
  text: string;
  position?: "top" | "bottom" | "left" | "right";
}

const Tooltip = ({ children, text, position = "top" }: TooltipProps) => {
  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  }[position];

  const arrowClasses = {
    top: "w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45 -mt-1 shadow-xl",
    bottom:
      "w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45 -mb-1 shadow-xl absolute -top-1",
    left: "w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45 -ml-1 shadow-xl absolute -right-1",
    right:
      "w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45 -mr-1 shadow-xl absolute -left-1",
  }[position];

  return (
    <div className="group relative flex items-center">
      {children}
      <div
        className={`absolute ${positionClasses} hidden group-hover:flex ${position === "left" || position === "right" ? "flex-row" : "flex-col"} items-center z-[200] pointer-events-none animate-in fade-in zoom-in-95 duration-200`}
      >
        {(position === "bottom" || position === "right") && (
          <div className={arrowClasses}></div>
        )}
        <div className="bg-gray-900 dark:bg-gray-700 text-white text-[10px] font-semibold py-1 px-2.5 rounded-lg whitespace-nowrap shadow-xl">
          {text}
        </div>
        {(position === "top" || position === "left") && (
          <div className={arrowClasses}></div>
        )}
      </div>
    </div>
  );
};

export default Tooltip;
