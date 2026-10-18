import * as SeparatorPrimitive from "@radix-ui/react-separator"
import { cn } from "../../lib/utils";

interface SeparatorProps {
className?: string;
orientation?: "horizontal"| "vertical";
}

const Separator = ({ className, orientation = "horizontal", ...props }: SeparatorProps) => (
  <SeparatorPrimitive.Root
    orientation={orientation}
    className={cn(
      "bg-black shrink-0",
      orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
      className,
    )}
    {...props}
  />
);

export { Separator };
