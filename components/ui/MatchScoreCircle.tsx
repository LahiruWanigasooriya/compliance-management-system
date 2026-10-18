import { cn } from "@/lib/utils";

export type MatchScoreVariant = {
  label: string;
  progressColor: string;
  trackColor: string;
  badgeClasses: string;
  textClassName: string;
  subTextClassName?: string;
};

export const getMatchScoreVariant = (score: number): MatchScoreVariant => {
  if (score < 40) {
    return {
      label: "Low Risk",
      progressColor: "rgb(34 197 94)",
      trackColor: "rgba(34, 197, 94, 0.25)",
      badgeClasses:
        "px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-200 dark:border-green-700",
      textClassName: "text-green-800",
    };
  }
  if (score < 70) {
    return {
      label: "Medium Risk",
      progressColor: "rgb(245 158 11)",
      trackColor: "rgba(245, 158, 11, 0.25)",
      badgeClasses:
        "px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-200 dark:border-orange-700",
      textClassName: "text-orange-700",
    };
  }
  return {
    label: "High Risk",
    progressColor: "rgb(239 68 68)",
    trackColor: "rgba(239, 68, 68, 0.25)",
    badgeClasses:
      "px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-200 dark:border-red-700",
    textClassName: "text-red-800",
  };
};

interface MatchScoreCircleProps {
  score: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  progressColor?: string;
  trackColor?: string;
  textClassName?: string;
  subTextClassName?: string;
  className?: string;
}

const MatchScoreCircle = ({
  score,
  max = 100,
  size = 96,
  strokeWidth = 8,
  progressColor = "rgb(34 197 94)",
  trackColor = "rgba(34, 197, 94, 0.2)",
  textClassName,
  subTextClassName,
  className,
}: MatchScoreCircleProps) => {
  const normalizedScore = Math.max(0, Math.min(score, max));
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const progress = normalizedScore / max;
  const strokeDashoffset = circumference * (1 - progress);

  const numberTextClass = textClassName ?? "text-foreground";
  const subNumberTextClass = subTextClassName ?? "text-muted-foreground";

  return (
    <div className={cn("relative", className)}>
      <svg
        className="w-full h-full transform -rotate-90"
        width={size}
        height={size}
        viewBox="0 0 100 100"
      >
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500 ease-out"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn("text-2xl font-bold leading-none", numberTextClass)}
        >
          {normalizedScore}
        </span>
        <span className={cn("text-sm font-medium", subNumberTextClass)}>
          / {max}
        </span>
      </div>
    </div>
  );
};

export default MatchScoreCircle;
