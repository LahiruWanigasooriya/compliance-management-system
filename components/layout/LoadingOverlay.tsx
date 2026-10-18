"use client";

import Loader from "../ui/loader/Loader";

interface LoadingOverlayProps {
  className?: string;
  loadingText?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  className,
  loadingText,
}) => {
  return (
    <div
      className={`${className} absolute inset-0 z-10 flex items-center justify-center bg-background/40 backdrop-blur-sm`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex items-center gap-10 text-sm font-medium text-foreground">
        <Loader />
        <span>{loadingText || "Loading..."}</span>
      </div>
    </div>
  );
};

export default LoadingOverlay;
