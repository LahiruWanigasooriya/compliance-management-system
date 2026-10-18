"use client";

import React, { useState } from "react";

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
  maxLength?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({
  text,
  children,
  position = "top",
  delay = 0,
  maxLength = 30,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const isTruncated = text.length > maxLength;

  const handleMouseEnter = () => {
    if (!isTruncated) return;
    const id = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    setTimeoutId(id);
  };

  const handleMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsVisible(false);
  };

  const getPositionClasses = () => {
    const baseClasses =
      "absolute px-3 py-2 bg-gray-900 text-white text-xs rounded-lg  z-50 shadow-lg ";

    switch (position) {
      case "bottom":
        return `${baseClasses} top-full left-1/2 -translate-x-1/2 mt-2`;
      case "left":
        return `${baseClasses} right-full top-1/2 -translate-y-1/2 mr-2`;
      case "right":
        return `${baseClasses} left-full top-1/2 -translate-y-1/2 ml-2`;
      case "top":
      default:
        return `${baseClasses} bottom-full left-1/2 -translate-x-1/2 mb-2`;
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case "bottom":
        return "absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-900";
      case "left":
        return "absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gray-900";

      case "right":
        return "absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900";
      case "top":
      default:
        return "absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900";
    }
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={isTruncated ? "" : ""}
      >
        {children}
      </div>
      {isVisible && isTruncated && (
        <div className={getPositionClasses()}>
          {text}
          <div className={getArrowClasses()}></div>
        </div>
      )}
    </div>
  );
};
